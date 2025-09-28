import { Injectable, Logger } from '@nestjs/common'
import * as xml2js from 'xml2js'
import { GenerateInvoiceService } from './generate-invoice.service'
import { SignInvoiceService } from './sign-invoice.service'
import { GeneratePdfService } from './generate-pdf.service'
import { EmailService } from '../email/email.service'
import { AutorizationCodeDto } from '../utils/autorization-code.dto'
import {
  SRIAuthorizationDto,
  SRIResponseDto,
} from '../interfaces/sri-response.dto'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class ElectronicInvoiceService {
  private sriReceptionUrl: string
  private sriAuthorizationUrl: string

  constructor(
    private readonly signService: SignInvoiceService,
    private readonly invoiceService: GenerateInvoiceService,
    private readonly invoicePdfService: GeneratePdfService,
    private readonly emailService: EmailService,
  ) {
    // Usa TEST por defecto; permite PROD si existen esas variables
    this.sriReceptionUrl =
      process.env.SRI_RECEPTION_URL_TEST || process.env.SRI_RECEPTION_URL || ''
    this.sriAuthorizationUrl =
      process.env.SRI_AUTHORIZATION_URL_TEST ||
      process.env.SRI_AUTHORIZATION_URL ||
      ''
  }

  async processInvoice(xmlContent: string, accessKey: string) {
    if (!xmlContent) {
      return { message: 'Error. Contenido XML no proporcionado.' }
    }

    try {
      Logger.log('Iniciando proceso de facturación...')

      /** 1) Parsear y validar el XML */
      const parser = new xml2js.Parser({ explicitArray: false })
      const parsedXML = await parser.parseStringPromise(xmlContent)

      if (
        !parsedXML?.factura?.infoTributaria ||
        !parsedXML?.factura?.infoFactura
      ) {
        return {
          message:
            'Estructura XML inválida: falta factura.infoTributaria o factura.infoFactura',
        }
      }

      const factura = parsedXML.factura
      const infoTributaria = factura.infoTributaria
      const infoFactura = factura.infoFactura

      /** 2) (Opcional) Generar clave de acceso local
       *  Si ya te llega `accessKey` desde afuera, solo la asignamos.
       */
      Logger.log('Asignando clave de acceso...')
      // Si quisieras calcularla aquí, descomenta y arma el dto:
      // const accessKeyData: AutorizationCodeDto = {
      //   date: this.parseDate(infoFactura.fechaEmision as string),
      //   codDoc: infoTributaria.codDoc,
      //   ruc: infoTributaria.ruc,
      //   environment: infoTributaria.ambiente,
      //   establishment: infoTributaria.estab,
      //   emissionPoint: infoTributaria.ptoEmi,
      //   sequential: infoTributaria.secuencial,
      // }
      // const accessKey = generateAccessKey(accessKeyData)
      Logger.log(`Clave de acceso: ${accessKey}`)

      factura.infoTributaria.claveAcceso = accessKey

      const builder = new xml2js.Builder({
        xmldec: { version: '1.0', encoding: 'UTF-8' },
      })
      const updatedInvoice: string = builder.buildObject(parsedXML)

      /** 3) Firmar el XML */
      Logger.log('Firmando XML...')
      const signature = this.signService.getP12Certificate()
      const password = process.env.SIGNATURE_PASSWORD ?? ''
      if (!password) {
        throw new Error('SIGNATURE_PASSWORD no definido')
      }

      // (Opcional pero recomendado) inspeccionar el P12 antes de firmar
      try {
        const certInfo = this.signService.verifyP12(signature, password)
        Logger.log(`[P12] subject=${certInfo.subject} alg=${certInfo.alg}`)
      } catch (vErr: any) {
        Logger.warn(
          'No se pudo verificar el .p12 antes de firmar: ' + vErr?.message,
        )
      }

      // OJO: signXml es async -> await
      const signedInvoice = await this.signService.signXml(
        signature,
        password,
        updatedInvoice,
      )
      Logger.log('XML firmado correctamente.')

      // (Opcional) validar que el X509 embebido es decodificable
      try {
        const x = await this.signService.checkSigned(signedInvoice)
        Logger.log(
          `[SIGN] serial=${x.serialNumber} validFrom=${x.notBefore} validTo=${x.notAfter}`,
        )
      } catch (xErr: any) {
        Logger.warn('No se pudo validar X509 embebido: ' + xErr?.message)
      }

      /** 4) Enviar a recepción del SRI */
      Logger.log('Enviando a recepción del SRI...')
      const reception: SRIAuthorizationDto =
        await this.invoiceService.documentReception(
          signedInvoice,
          this.sriReceptionUrl,
        )
      Logger.log(reception)

      if (
        !reception ||
        reception.RespuestaRecepcionComprobante.estado !== 'RECIBIDA'
      ) {
        Logger.error(
          'Error en recepción:',
          reception?.RespuestaRecepcionComprobante,
        )
        return {
          message: 'Error en recepción',
          detalles: reception?.RespuestaRecepcionComprobante,
        }
      }
      Logger.log('Recepción exitosa.')

      /** 5) Consultar autorización del SRI */
      Logger.log('Consultando autorización del SRI...')
      const authorization: SRIResponseDto =
        await this.invoiceService.documentAuthorization(
          accessKey,
          this.sriAuthorizationUrl,
        )
      Logger.log(authorization)
      const autorizacion =
        authorization?.RespuestaAutorizacionComprobante?.autorizaciones
          ?.autorizacion

      Logger.log(
        'Mensajes de autorización:',
        JSON.stringify(autorizacion?.mensajes, null, 2),
      )

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        Logger.error('Documento NO autorizado:', autorizacion?.estado)
        return { message: 'Documento no autorizado', detalles: autorizacion }
      }

      // Extraer XML autorizado desde la etiqueta "comprobante"
      const authorizedXml = autorizacion.comprobante
      if (!authorizedXml) {
        Logger.error(
          'No se encontró el comprobante autorizado en la respuesta del SRI.',
        )
        return {
          message: 'No se encontró el comprobante autorizado.',
          detalles: autorizacion,
        }
      }

      /** 6) Generar PDF */
      Logger.log('Generando PDF...')
      const pdf = await this.invoicePdfService
        .dataInvoice([reception, authorization])
        .catch((error) => {
          Logger.error('Error al generar PDF:', error)
          return null
        })

      if (!pdf) {
        return {
          message: 'Factura procesada exitosamente y enviada al cliente.',
          estado: autorizacion.estado,
        }
      }

      const email = pdf.email as string
      const pdfBuffer = pdf.pdfBuffer

      Logger.log('Enviando correo...')
      if (pdfBuffer && pdfBuffer.byteLength > 0) {
        await this.emailService.sendEmailWithInvoices(
          email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          pdfBuffer,
          authorizedXml,
        )
        Logger.log('Correo enviado exitosamente.')
      } else {
        Logger.warn('El PDF buffer está vacío, no se envía correo.')
      }

      return {
        message: 'Factura procesada exitosamente y enviada al cliente.',
        estado: autorizacion.estado,
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al procesar la factura'
      Logger.error('Error al procesar la factura: ' + errorMessage)
      return { message: 'Error al procesar la factura: ' + errorMessage }
    }
  }

  async authorizeInvoice(accessKey: string) {
    try {
      Logger.log('Consultando autorización del SRI...')
      const authorization: SRIResponseDto =
        await this.invoiceService.documentAuthorization(
          accessKey,
          this.sriAuthorizationUrl,
        )
      Logger.log(authorization)
      const autorizacion =
        authorization?.RespuestaAutorizacionComprobante?.autorizaciones
          ?.autorizacion

      Logger.log(
        'Mensajes de autorización:',
        JSON.stringify(autorizacion?.mensajes, null, 2),
      )

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        Logger.error('Documento NO autorizado:', autorizacion?.estado)
        return { message: 'Documento no autorizado', detalles: autorizacion }
      }

      // Extraer XML autorizado desde la etiqueta "comprobante"
      const authorizedXml = autorizacion.comprobante
      if (!authorizedXml) {
        Logger.error(
          'No se encontró el comprobante autorizado en la respuesta del SRI.',
        )
        return {
          message:
            'No se encontró el comprobante autorizado en la respuesta del SRI.',
        }
      }

      /** 6) Generar PDF */
      Logger.log('Generando PDF...')
      const pdf = await this.invoicePdfService
        .dataInvoice([null, authorization])
        .catch((error) => {
          Logger.error('Error al generar PDF:', error)
          return null
        })

      if (!pdf) {
        return {
          message: 'Factura procesada exitosamente y enviada al cliente.',
          estado: autorizacion.estado,
        }
      }

      const email = pdf.email as string
      const pdfBuffer = pdf.pdfBuffer

      Logger.log('Enviando correo...')
      if (pdfBuffer && pdfBuffer.byteLength > 0) {
        await this.emailService.sendEmailWithInvoices(
          email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          pdfBuffer,
          authorizedXml,
        )
        Logger.log('Correo enviado exitosamente.')
      } else {
        Logger.warn('El PDF buffer está vacío, no se envía correo.')
      }

      return {
        message: 'Factura procesada exitosamente y enviada al cliente.',
        estado: autorizacion.estado,
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al procesar la factura'
      Logger.error('Error al procesar la factura: ' + errorMessage)
      return { message: 'Error al procesar la factura: ' + errorMessage }
    }
  }

  private parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('/').map(Number)
    return DateUtil.getLocalDate(new Date(year, month - 1, day))
  }
}
