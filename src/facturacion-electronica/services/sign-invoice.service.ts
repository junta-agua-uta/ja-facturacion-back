import { Injectable, Logger } from '@nestjs/common'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import * as forge from 'node-forge'
import { parseStringPromise } from 'xml2js'
import * as xmldsig from 'xml-crypto'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import * as crypto from 'crypto'

@Injectable()
export class SignInvoiceService {
  private readonly logger = new Logger(SignInvoiceService.name)

  async signXml(
    p12Data: Buffer,
    p12Password: string,
    xmlData: string,
  ): Promise<string> {
    this.logger.log('Iniciando proceso de firma XML...')

    if (!p12Password) {
      throw new Error('SIGNATURE_PASSWORD vacío o no configurado')
    }

    // 1) Verificar P12
    const p12Info = this.verifyP12(p12Data, p12Password)
    this.logger.log(`P12 verificado: ${p12Info.subject}, alg=${p12Info.alg}`)

    // 2) Normalizar XML
    const xml = (xmlData ?? '').trim()
    if (!xml) throw new Error('XML data está vacío')

    // 3) Firmar con xml-crypto en modo XAdES-BES
    this.logger.log('Firmando XML (XAdES-BES, EXC-C14N)...')
    const signedInvoice = await this.signWithXmlCrypto(
      xml,
      p12Data,
      p12Password,
    )
    this.logger.log('XML firmado exitosamente')

    return signedInvoice
  }

  /**
   * Firma con xml-crypto construyendo XAdES-BES corregido para SRI
   */
  private async signWithXmlCrypto(
    xml: string,
    p12Data: Buffer,
    p12Password: string,
  ): Promise<string> {
    const { privateKeyPem, certificatesBase64, certObj, certChain } =
      this.extractKeyAndChainFromP12(p12Data, p12Password)

    // Parsear XML y asegurar id="comprobante"
    const dom = new DOMParser().parseFromString(xml, 'text/xml')
    const root = dom.documentElement
    if (!root.getAttribute('id')) {
      root.setAttribute('id', 'comprobante')
    }

    // IDs únicos
    const sigId = `Signature-${Date.now()}`
    const spId = `SignedProperties-${Date.now()}`

    // PRIMERO: Crear y insertar el SignedProperties en el DOM ANTES de firmar
    this.createAndInsertSignedProperties(dom, sigId, spId, certObj, certChain)

    // Configuración de firma
    const signature = new xmldsig.SignedXml()
    signature.signatureAlgorithm =
      'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'
    signature.canonicalizationAlgorithm =
      'http://www.w3.org/2001/10/xml-exc-c14n#'
    signature.signingKey = privateKeyPem

    // Reference #1: documento (enveloped + EXC-C14N)
    signature.addReference(
      "//*[@id='comprobante']",
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/2001/10/xml-exc-c14n#',
      ],
      'http://www.w3.org/2001/04/xmlenc#sha256',
    )

    // Reference #2: SignedProperties (Type XAdES) con EXC-C14N
    signature.addReference(
      `//*[@Id='${spId}']`,
      ['http://www.w3.org/2001/10/xml-exc-c14n#'],
      'http://www.w3.org/2001/04/xmlenc#sha256',
      '',
      'http://uri.etsi.org/01903#SignedProperties',
    )

    // KeyInfo con cadena completa
    signature.keyInfoProvider = {
      getKeyInfo: () => {
        const x509s = certificatesBase64
          .map((c) => `<ds:X509Certificate>${c}</ds:X509Certificate>`)
          .join('')
        return `<ds:X509Data xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${x509s}</ds:X509Data>`
      },
      getKey: () => Buffer.from(privateKeyPem),
    }

    // Calcular la firma (ahora el SignedProperties ya está en el DOM)
    const xmlToSign = new XMLSerializer().serializeToString(dom)

    // DEBUG: Guardar XML antes de firmar
    if (process.env.NODE_ENV !== 'production') {
      writeFileSync('./debug_xml_before_sign.xml', xmlToSign)
    }

    signature.computeSignature(xmlToSign, {
      location: { reference: "//*[@id='comprobante']", action: 'append' },
      prefix: 'ds',
      attrs: { Id: sigId },
    })

    // Obtener el XML firmado
    let signedXml = signature.getSignedXml()

    // AHORA mover el SignedProperties al ds:Object dentro de la firma
    signedXml = this.moveSignedPropertiesToSignature(signedXml, sigId, spId)

    // DEBUG: Guardar XML después de firmar
    if (process.env.NODE_ENV !== 'production') {
      writeFileSync('./debug_xml_after_sign.xml', signedXml)
    }

    return signedXml
  }

  /**
   * Crea e inserta SignedProperties en el DOM ANTES de la firma (XAdES-BES)
   */
  private createAndInsertSignedProperties(
    dom: Document,
    signatureId: string,
    signedPropsId: string,
    cert: forge.pki.Certificate,
    _certChain: forge.pki.Certificate[],
  ): void {
    const xadesNS = 'http://uri.etsi.org/01903/v1.3.2#'
    const dsNS = 'http://www.w3.org/2000/09/xmldsig#'

    // Calcular digest del certificado end-entity (en formato DER)
    const certDer = forge.asn1
      .toDer(forge.pki.certificateToAsn1(cert))
      .getBytes()
    const certDigestB64 = crypto
      .createHash('sha256')
      .update(certDer, 'binary')
      .digest('base64')

    // Información del certificado en formato SRI
    const issuer = this.formatIssuerForSRI(cert)
    const serialHex = cert.serialNumber
    const serialDec = BigInt('0x' + serialHex).toString(10)

    // Crear elementos con namespaces correctos
    const qualifyingProperties = dom.createElementNS(
      xadesNS,
      'xades:QualifyingProperties',
    )
    qualifyingProperties.setAttribute('Target', `#${signatureId}`)

    const signedProperties = dom.createElementNS(
      xadesNS,
      'xades:SignedProperties',
    )
    signedProperties.setAttribute('Id', signedPropsId)

    const signedSignatureProperties = dom.createElementNS(
      xadesNS,
      'xades:SignedSignatureProperties',
    )

    // 1. SigningTime
    const signingTime = dom.createElementNS(xadesNS, 'xades:SigningTime')
    signingTime.textContent = new Date().toISOString()

    // 2. SigningCertificateV2
    const signingCertificateV2 = dom.createElementNS(
      xadesNS,
      'xades:SigningCertificateV2',
    )
    const certEl = dom.createElementNS(xadesNS, 'xades:Cert')

    // DigestAlgAndValue
    const digestAlgAndValue = dom.createElementNS(
      xadesNS,
      'xades:DigestAlgAndValue',
    )
    const digestMethod = dom.createElementNS(dsNS, 'ds:DigestMethod')
    digestMethod.setAttribute(
      'Algorithm',
      'http://www.w3.org/2001/04/xmlenc#sha256',
    )
    const digestValue = dom.createElementNS(dsNS, 'ds:DigestValue')
    digestValue.textContent = certDigestB64
    digestAlgAndValue.appendChild(digestMethod)
    digestAlgAndValue.appendChild(digestValue)

    // IssuerSerialV2
    const issuerSerialV2 = dom.createElementNS(xadesNS, 'xades:IssuerSerialV2')
    const x509IssuerName = dom.createElementNS(xadesNS, 'xades:X509IssuerName')
    x509IssuerName.textContent = issuer
    const x509SerialNumber = dom.createElementNS(
      xadesNS,
      'xades:X509SerialNumber',
    )
    x509SerialNumber.textContent = serialDec
    issuerSerialV2.appendChild(x509IssuerName)
    issuerSerialV2.appendChild(x509SerialNumber)

    // Construir estructura del certificado
    certEl.appendChild(digestAlgAndValue)
    certEl.appendChild(issuerSerialV2)
    signingCertificateV2.appendChild(certEl)

    // 3. SignaturePolicyIdentifier (IMPLIED, sin hash “dummy”)
    const signaturePolicyIdentifier = this.createSignaturePolicyIdentifier(dom)

    // 4. SignatureProductionPlace (opcional pero aceptado por SRI)
    const signatureProductionPlace = dom.createElementNS(
      xadesNS,
      'xades:SignatureProductionPlace',
    )
    const city = dom.createElementNS(xadesNS, 'xades:City')
    city.textContent = 'Santa Rosa'
    const countryName = dom.createElementNS(xadesNS, 'xades:CountryName')
    countryName.textContent = 'EC'
    signatureProductionPlace.appendChild(city)
    signatureProductionPlace.appendChild(countryName)

    // 5. SignerRole (opcional)
    const signerRole = dom.createElementNS(xadesNS, 'xades:SignerRole')
    const claimedRoles = dom.createElementNS(xadesNS, 'xades:ClaimedRoles')
    const claimedRole = dom.createElementNS(xadesNS, 'xades:ClaimedRole')
    claimedRole.textContent = 'Representante Legal'
    claimedRoles.appendChild(claimedRole)
    signerRole.appendChild(claimedRoles)

    // Construir SignedSignatureProperties (SIN CertificateValues y SIN SignedDataObjectProperties)
    signedSignatureProperties.appendChild(signingTime)
    signedSignatureProperties.appendChild(signingCertificateV2)
    signedSignatureProperties.appendChild(signaturePolicyIdentifier)
    signedSignatureProperties.appendChild(signatureProductionPlace)
    signedSignatureProperties.appendChild(signerRole)

    signedProperties.appendChild(signedSignatureProperties)
    qualifyingProperties.appendChild(signedProperties)

    // Insertar temporalmente al final del documento (antes de firmar)
    dom.documentElement.appendChild(qualifyingProperties)
  }

  /**
   * Crea SignaturePolicyIdentifier de tipo "Implied" (sin OID ni hash dummy)
   */
  private createSignaturePolicyIdentifier(dom: Document): Element {
    const xadesNS = 'http://uri.etsi.org/01903/v1.3.2#'
    const signaturePolicyIdentifier = dom.createElementNS(
      xadesNS,
      'xades:SignaturePolicyIdentifier',
    )
    const implied = dom.createElementNS(xadesNS, 'xades:SignaturePolicyImplied')
    signaturePolicyIdentifier.appendChild(implied)
    return signaturePolicyIdentifier
  }

  /**
   * Formatea el issuer según lo espera el SRI
   */
  private formatIssuerForSRI(cert: forge.pki.Certificate): string {
    const attributes = cert.issuer.attributes
    const parts = []

    // Orden comúnmente aceptado por SRI
    const order = ['C', 'O', 'OU', 'ST', 'CN', 'L']

    for (const field of order) {
      const attr = attributes.find((a) => a.shortName === field)
      if (attr) {
        parts.push(`${field}=${attr.value}`)
      }
    }

    return parts.join(', ')
  }

  /**
   * Mueve el SignedProperties del documento principal al ds:Object dentro de la firma
   */
  private moveSignedPropertiesToSignature(
    signedXml: string,
    _signatureId: string,
    _signedPropsId: string,
  ): string {
    const dom = new DOMParser().parseFromString(signedXml, 'text/xml')
    const xadesNS = 'http://uri.etsi.org/01903/v1.3.2#'
    const dsNS = 'http://www.w3.org/2000/09/xmldsig#'

    // Buscar el elemento Signature
    const signatureElements = dom.getElementsByTagNameNS(dsNS, 'Signature')
    if (signatureElements.length === 0) {
      throw new Error('No se encontró elemento Signature en el XML firmado')
    }
    const signatureElement = signatureElements[0]

    // Buscar el QualifyingProperties en el documento principal
    const qualifyingPropertiesElements = dom.getElementsByTagNameNS(
      xadesNS,
      'QualifyingProperties',
    )
    if (qualifyingPropertiesElements.length === 0) {
      return signedXml
    }
    const qualifyingProperties = qualifyingPropertiesElements[0]

    // Remover del documento principal
    qualifyingProperties.parentNode?.removeChild(qualifyingProperties)

    // Crear ds:Object y mover QualifyingProperties dentro de él
    const dsObject = dom.createElementNS(dsNS, 'ds:Object')
    dsObject.appendChild(qualifyingProperties)

    // Insertar ds:Object después de ds:KeyInfo
    const keyInfoElements = signatureElement.getElementsByTagNameNS(
      dsNS,
      'KeyInfo',
    )
    if (keyInfoElements.length > 0) {
      const keyInfo = keyInfoElements[0]
      if (keyInfo.nextSibling) {
        signatureElement.insertBefore(dsObject, keyInfo.nextSibling)
      } else {
        signatureElement.appendChild(dsObject)
      }
    } else {
      signatureElement.appendChild(dsObject)
    }

    return new XMLSerializer().serializeToString(dom)
  }

  /**
   * Extrae clave privada y cadena de certificados en orden
   */
  private extractKeyAndChainFromP12(
    p12Data: Buffer,
    p12Password: string,
  ): {
    privateKeyPem: string
    certificatesBase64: string[]
    certObj: forge.pki.Certificate
    certChain: forge.pki.Certificate[]
  } {
    try {
      const bin = p12Data.toString('binary')
      const asn1 = forge.asn1.fromDer(forge.util.createBuffer(bin))
      const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, p12Password)

      // Clave privada
      const keyBags1 =
        p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
          forge.pki.oids.pkcs8ShroudedKeyBag
        ] || []
      const keyBags2 =
        p12.getBags({ bagType: forge.pki.oids.keyBag })[
          forge.pki.oids.keyBag
        ] || []
      const key = (keyBags1[0]?.key || keyBags2[0]?.key) as forge.pki.PrivateKey
      if (!key) throw new Error('P12 sin clave privada')
      const privateKeyPem = forge.pki.privateKeyToPem(key)

      // Certificados
      const certBags =
        p12.getBags({ bagType: forge.pki.oids.certBag })[
          forge.pki.oids.certBag
        ] || []
      if (!certBags.length) throw new Error('P12 sin certificados')

      const certs: forge.pki.Certificate[] = certBags.map(
        (b) => b.cert as forge.pki.Certificate,
      )

      // Convertir a base64 manteniendo el orden
      const certificatesBase64 = certs.map((c) => {
        const der = forge.asn1.toDer(forge.pki.certificateToAsn1(c)).getBytes()
        return Buffer.from(der, 'binary').toString('base64')
      })

      // El primero se asume end-entity
      const endEntity = certs[0]

      this.logger.log(
        `Cadena de certificados: ${certs.length} certificados encontrados`,
      )
      certs.forEach((cert, index) => {
        const subject = cert.subject.attributes
          .map((a) => `${a.shortName}=${a.value}`)
          .join(', ')
        this.logger.log(`Cert ${index + 1}: ${subject}`)
      })

      return {
        privateKeyPem,
        certificatesBase64,
        certObj: endEntity,
        certChain: certs,
      }
    } catch (error: any) {
      throw new Error(`Error extrayendo clave y certificado: ${error.message}`)
    }
  }

  getP12Certificate(): Buffer {
    const p12Path =
      process.env.NODE_ENV === 'production'
        ? '/tmp/firmajunta.p12'
        : './firmajunta.p12'
    this.logger.log(`Buscando certificado en: ${p12Path}`)
    if (!existsSync(p12Path))
      throw new Error(`El archivo P12 no existe en la ruta: ${p12Path}`)
    try {
      const p12Data = readFileSync(p12Path)
      this.logger.log(
        `Certificado P12 cargado correctamente, tamaño: ${p12Data.length} bytes`,
      )
      return p12Data
    } catch (error: any) {
      throw new Error(`No se pudo cargar el certificado P12: ${error.message}`)
    }
  }

  public verifyP12(
    p12Data: Buffer,
    p12Password: string,
  ): { subject: string; alg: 'RSA' | 'EC' } {
    try {
      const bin = p12Data.toString('binary')
      const asn1 = forge.asn1.fromDer(forge.util.createBuffer(bin))
      const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, p12Password)

      const certBags =
        p12.getBags({ bagType: forge.pki.oids.certBag })[
          forge.pki.oids.certBag
        ] || []
      const keyBags =
        p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
          forge.pki.oids.pkcs8ShroudedKeyBag
        ] || []

      if (!certBags.length) throw new Error('P12 sin certificados')
      if (!keyBags.length) throw new Error('P12 sin clave privada')

      const cert = certBags[0].cert as forge.pki.Certificate
      const subject = cert.subject.attributes
        .map((a) => `${a.shortName}=${a.value}`)
        .join(', ')
      const alg = cert.publicKey && (cert.publicKey as any).n ? 'RSA' : 'EC'

      return { subject, alg }
    } catch (e: any) {
      throw new Error('Error verificando el .p12: ' + e.message)
    }
  }

  public async checkSigned(
    signedXml: string,
  ): Promise<{ serialNumber: string; notBefore: Date; notAfter: Date }> {
    try {
      const obj = await parseStringPromise(signedXml, {
        explicitArray: false,
        preserveChildrenOrder: true,
      })

      const findFirstByLocalName = (
        node: any,
        target: string,
      ): string | null => {
        if (node == null) return null
        if (typeof node === 'string') return null

        if (Array.isArray(node)) {
          for (const item of node) {
            const found = findFirstByLocalName(item, target)
            if (found) return found
          }
          return null
        }

        for (const [k, v] of Object.entries(node)) {
          const local = k.includes(':') ? k.split(':')[1] : k

          if (local === target) {
            if (typeof v === 'string') return v
            if (Array.isArray(v)) {
              for (const item of v) {
                if (typeof item === 'string') return item
                if (item && typeof item === 'object') {
                  if (typeof (item as any)._ === 'string')
                    return (item as any)._
                }
              }
            }
            if (
              v &&
              typeof v === 'object' &&
              typeof (v as any)._ === 'string'
            ) {
              return (v as any)._
            }
          }

          const child = findFirstByLocalName(v as any, target)
          if (child) return child
        }

        return null
      }

      const certB64Raw = findFirstByLocalName(obj, 'X509Certificate')
      if (!certB64Raw) {
        throw new Error('No se encontró <X509Certificate> en el XML firmado')
      }

      const certB64 = (certB64Raw as string).replace(/\s+/g, '')
      const derBuf = Buffer.from(certB64, 'base64')
      if (!derBuf.length) throw new Error('Contenido de X509 inválido')

      const asn1 = forge.asn1.fromDer(
        forge.util.createBuffer(derBuf.toString('binary')),
      )
      const cert = forge.pki.certificateFromAsn1(asn1)

      return {
        serialNumber: cert.serialNumber,
        notBefore: cert.validity.notBefore,
        notAfter: cert.validity.notAfter,
      }
    } catch (error: any) {
      throw new Error(`Error verificando XML firmado: ${error.message}`)
    }
  }
}
