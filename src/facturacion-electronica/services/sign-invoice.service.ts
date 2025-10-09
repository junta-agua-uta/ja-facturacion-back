import { Injectable } from '@nestjs/common'
import { readFileSync, writeFileSync } from 'fs'
import { signInvoiceXml } from 'ec-sri-invoice-signer'

@Injectable()
export class SignInvoiceService {
  signXml(_p12Data: Buffer, p12Password: string, xmlData: string) {
    let xml = xmlData
    xml = xml.replace(/\s+/g, ' ')
    xml = xml.trim()
    xml = xml.replace(/(?<=>)(\r?\n)|(\r?\n)(?=<\/)/g, '')
    xml = xml.trim()
    xml = xml.replace(/(?<=>)(\s*)/g, '')
    const firstLineEndIndex = xml.indexOf('\n')

    if (firstLineEndIndex !== -1) {
      // Extraer la primera línea del XML
      const firstLine = xml.substring(0, firstLineEndIndex).trim()

      // Reemplazar solo si la primera línea no está vacía
      if (firstLine.length > 0) {
        // Reemplazar la primera línea por una nueva línea especificando UTF-8
        const newFirstLine = '<?xml version="1.0" encoding="UTF-8"?>'
        xml = `${newFirstLine}\n${xml.substring(firstLineEndIndex + 1).trim()}`
      }
    }
    const ruta = process.env.NODE_ENV === 'production' ? '/tmp' : '.'
    writeFileSync(`${ruta}/invoice.xml`, xml)
    const signedInvoice = signInvoiceXml(xml, _p12Data, {
      pkcs12Password: p12Password,
    })
    writeFileSync(`${ruta}/signedInvoice.xml`, signedInvoice)
    return signedInvoice
  }

  getP12Certificate(): Buffer {
    const p12Path = './firmajunta.p12'

    try {
      return readFileSync(p12Path)
    } catch (error) {
      throw new Error(
        `No se pudo cargar el certificado P12 desde ${p12Path}: ${error.message}`,
      )
    }
  }
  // verifyP12(p12Data: ArrayBuffer, p12Password: string): boolean {
  //   try {
  //     const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Data))
  //     const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password)

  //     const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  //     const pkcs8Bags = p12.getBags({
  //       bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
  //     })

  //     if (
  //       certBags[forge.pki.oids.certBag] &&
  //       pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag]
  //     ) {
  //       // Verificar que hay al menos un certificado y una clave
  //       return true
  //     }
  //   } catch (error) {
  //     throw new Error('Error verificando el archivo .p12: ' + error)
  //   }

  //   return false
  // }

  // async getP12FromUrl(url: string) {
  //   const file = await fetch(url)
  //     .then((response) => response.arrayBuffer())
  //     .then((data) => data)
  //   return file
  // }

  // getXMLFromLocalFile(path: string) {
  //   const file = readFileSync(path, 'utf8')
  //   return file
  // }

  // async getXMLFromLocalUrl(url: string) {
  //   const file = await fetch(url)
  //     .then((response) => response.text())
  //     .then((data) => data)
  //   return file
  // }

  // sha1Base64(text: string, encoding: forge.Encoding = 'utf8') {
  //   const md = forge.md.sha1.create()
  //   md.update(text, encoding)
  //   const hash = md.digest().toHex()
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  //   const buffer = Buffer.from(hash, 'hex')
  //   const base64 = buffer.toString('base64')
  //   return base64
  // }

  // hexToBase64(hex: string) {
  //   hex = hex.padStart(hex.length + (hex.length % 2), '0')
  //   const bytes = hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  //   return btoa(String.fromCharCode(...bytes))
  // }

  // bigIntToBase64(bigInt: number) {
  //   const hex = bigInt.toString(16)
  //   const hexPairs = hex.match(/\w{2}/g)
  //   const bytes = hexPairs!.map((pair) => parseInt(pair, 16))
  //   const byteString = String.fromCharCode(...bytes)
  //   const base64 = btoa(byteString)
  //   const formatedBase64 = base64.match(/.{1,76}/g)!.join('\n')
  //   return formatedBase64
  // }

  // getRandomNumber(min = 990, max = 9999) {
  //   return Math.floor(Math.random() * (max - min + 1) + min)
  // }
}
