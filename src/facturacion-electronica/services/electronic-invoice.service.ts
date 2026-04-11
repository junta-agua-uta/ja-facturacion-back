import { Injectable, Logger } from '@nestjs/common'
import * as xml2js from 'xml2js'
import { GenerateInvoiceService } from './generate-invoice.service'
import { SignInvoiceService } from './sign-invoice.service'
import { GeneratePdfService } from './generate-pdf.service'
import { EmailService } from '../email/email.service'
import { generateAccessKey } from '../utils/autorizacion-code.util'
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
    this.sriReceptionUrl = process.env.SRI_RECEPTION_URL_TEST || ''
    this.sriAuthorizationUrl = process.env.SRI_AUTHORIZATION_URL_TEST || ''
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

      Logger.log('Clave de acceso generada:', accessKey)

      factura.infoTributaria.claveAcceso = accessKey

      const builder = new xml2js.Builder({
        xmldec: { version: '1.0', encoding: 'UTF-8' },
      })
      const updatedInvoice: string = builder.buildObject(parsedXML)

      /** 3) Firmar el XML */
      Logger.log('Firmando XML...')
      const signature = this.signService.getP12Certificate()
      const password = process.env.SIGNATURE_PASSWORD
      if (!password) {
        throw new Error('SIGNATURE_PASSWORD no está definida en .env')
      }
      const signedInvoice = this.signService.signXml(
        signature,
        password,
        updatedInvoice,
      )
      Logger.log('XML firmado correctamente.')

      let autorizacionFinal: any = null;
      let esAutorizado = false;

      // Bucle de resiliencia extrema contra el SRI "celcer"
      for (let intento = 1; intento <= 10; intento++) {
        Logger.log(`\n============================`);
        Logger.log(`🔄 MANDANDO AL SRI - INTENTO #${intento} (Ronda de 10)`);
        Logger.log(`============================`);

        let isError70 = false;

        // 1) Enviar a Recepción
        Logger.log('Enviando a recepción del SRI...');
        let reception;
        try {
          reception = await this.invoiceService.documentReception(
            signedInvoice,
            this.sriReceptionUrl,
          );
        } catch (error) {
          Logger.error(`Error de red en recepción (Intento ${intento}): ${error.message}`);
          if (intento < 10) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          } else {
            return {
              message: 'Error de red con SRI en Recepción',
              detalles: error.message,
              pending: true,
            };
          }
        }

        if (!reception || reception.RespuestaRecepcionComprobante.estado !== 'RECIBIDA') {
          const comprobantes: any = reception?.RespuestaRecepcionComprobante?.comprobantes;
          const msgs = comprobantes?.comprobante?.mensajes?.mensaje;
          const msgList = Array.isArray(msgs) ? msgs : [msgs];
          isError70 = msgList.some((m) => m?.identificador === '70');

          if (!isError70) {
            // Un error real (Firma inválida, fecha mala, etc). Rompemos todo.
            Logger.error('Error en recepción (NO es 70):', reception?.RespuestaRecepcionComprobante);
            require('fs').writeFileSync('sri_error.log', JSON.stringify(reception?.RespuestaRecepcionComprobante, null, 2));
            return {
              message: 'Error en recepción',
              detalles: reception?.RespuestaRecepcionComprobante,
              pending: false,
            };
          }
          Logger.log('⚠️ El SRI rebotó con Error 70...');
        } else {
          Logger.log('✅ Recepción exitosa.');
        }

        // 2) Esperamos antes de pedir Autorización
        Logger.log('Esperando 3 segundos a que el SRI digiera la factura...');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 3) Consultar Autorización
        Logger.log('Consultando si ya la autorizó...');
        let authorization: SRIResponseDto;
        try {
          authorization = await this.invoiceService.documentAuthorization(
            accessKey,
            this.sriAuthorizationUrl,
          );
        } catch (error) {
          Logger.error(`Error de red en autorización (Intento ${intento}): ${error.message}`);
          if (intento < 10) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          } else {
            return {
              message: 'Error de red con SRI en Autorización',
              detalles: error.message,
              pending: true,
            };
          }
        }

        const numComprobantes = authorization?.RespuestaAutorizacionComprobante?.numeroComprobantes;

        if (numComprobantes === '0') {
          // EL SRI LA BORRÓ (Se la tragó la cola de pruebas asíncrona)
          Logger.warn(`❌ ¡El SRI no tiene rastro de ella (numComprobantes: 0)! Se la tragó en el limbo y mintió con el 70.`);
          if (intento < 10) {
            Logger.log('Vamos a agarrar impulso y REPETIR el envío a RECEPCIÓN porque nunca entró de verdad.');
            await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 segs antes del proximo intento
            continue; // Vuelve a enviar el XML
          }
        }

        // Si llegó aquí es porque el numComprobantes NO es 0 (El SRI sí la guardó con éxito)
        const autorizaciones: any = authorization?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;
        autorizacionFinal = Array.isArray(autorizaciones) ? autorizaciones[autorizaciones.length - 1] : autorizaciones;

        if (autorizacionFinal && autorizacionFinal.estado === 'AUTORIZADO') {
          esAutorizado = true;
          Logger.log('¡ESTADO: AUTORIZADO!');
          break; // Rompemos el ciclo felices
        } else if (autorizacionFinal && autorizacionFinal.estado === 'RECHAZADO') {
          Logger.log('El SRI la analizó pero RECHAZÓ tus datos.');
          break; // Rompemos el ciclo decepcionados
        }
      }

      if (!esAutorizado) {
        Logger.error(
          'Documento NO autorizado definitivamente tras múltiples intentos.',
        )
        return {
          message: 'Documento no autorizado',
          detalles: autorizacionFinal,
          pending: !autorizacionFinal || autorizacionFinal.estado !== 'RECHAZADO',
        }
      }

      // Extraer XML autorizado desde la etiqueta "comprobante"
      const xmlAutorizado = autorizacionFinal?.comprobante;
      if (!xmlAutorizado) {
        Logger.error(
          'No se encontró el comprobante autorizado en la respuesta del SRI.',
        )
        return {
          message: 'No se encontró el comprobante autorizado.',
          detalles: autorizacionFinal,
        }
      }

      /** 6) Generar PDF */
      Logger.log('Generando PDF...')
      const fakeAuth: any = { RespuestaAutorizacionComprobante: { autorizaciones: { autorizacion: autorizacionFinal } } };

      const pdf = await this.invoicePdfService
        .dataInvoice([null, fakeAuth])
        .catch((error) => {
          Logger.error('Error al generar PDF:', error)
          return null
        })

      if (!pdf) {
        return {
          message: 'Factura procesada exitosamente y enviada al cliente.',
          estado: autorizacionFinal.estado,
        }
      }
      const email = pdf.email as string
      const pdfBuffer = pdf.pdfBuffer

      Logger.log('Enviando correo...')
      if (pdfBuffer.byteLength > 0) {
        await this.emailService.sendEmailWithInvoices(
          email,
          pdfBuffer,
          xmlAutorizado,
        )
        Logger.log('Correo enviado exitosamente.')
      } else {
        Logger.warn('El PDF buffer está vacío, no se envía correo.')
      }

      return {
        message: 'Factura procesada exitosamente y enviada al cliente.',
        estado: autorizacionFinal.estado,
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
      const response =
        await this.invoiceService.documentAuthorization(
          accessKey,
          this.sriAuthorizationUrl,
        )
      Logger.log(response)
      const authorization = Array.isArray(response) ? response[0] : response
      const autorizaciones =
        authorization?.RespuestaAutorizacionComprobante?.autorizaciones
          ?.autorizacion
      const autorizacion = Array.isArray(autorizaciones)
        ? autorizaciones[0]
        : autorizaciones

      Logger.log(
        'Mensajes de autorización:',
        JSON.stringify(autorizacion?.mensajes, null, 2),
      )

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        Logger.error('Documento NO autorizado:', autorizacion?.estado)
        return {
          message: 'Documento no autorizado',
          detalles: autorizacion,
          pending: !autorizacion || autorizacion.estado !== 'RECHAZADO',
        }
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
      if (pdfBuffer.byteLength > 0) {
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
      Logger.error('Error al procesar la factura:', errorMessage)
      return { message: 'Error al procesar la factura:' + errorMessage }
    }
  }

  private parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('/').map(Number)
    return DateUtil.getLocalDate(new Date(year, month - 1, day))
  }
}