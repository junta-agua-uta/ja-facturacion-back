import { Injectable, Logger } from '@nestjs/common'
import { createClient, Client } from 'soap'
import { create } from 'xmlbuilder2'
import {
  InvoiceDto,
  InvoiceInputDto,
} from 'src/facturacion-electronica/interfaces/invoice.dto'
import { generateAccessKey } from 'src/facturacion-electronica/utils/autorizacion-code.util'
import {
  SRIAuthorizationDto,
  SRIResponseDto,
} from '../interfaces/sri-response.dto'
import { DateUtil } from 'src/common/utils/date.util'
@Injectable()
export class GenerateInvoiceService {
  generateInvoiceXml(invoice: InvoiceDto) {
    const document = create({ version: '1.0', encoding: 'UTF-8' }, invoice)
    const xml = document.end({ prettyPrint: true })
    return xml
  }

  generateInvoice(invoiceData: InvoiceInputDto, email: string) {
    // Asegurar que la fecha tenga el formato correcto con ceros iniciales
    const [day, month, year] = invoiceData.infoFactura.fechaEmision
      .split('/')
      .map((part) => part.padStart(2, '0'))

    // Actualizar la fecha en el objeto con el formato corregido
    invoiceData.infoFactura.fechaEmision = `${day}/${month}/${year}`

    const formattedDateStr = `${year}-${month}-${day}`
    const date = DateUtil.getLocalDate(new Date(formattedDateStr))
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
    const accessKey = generateAccessKey({
      date,
      codDoc: invoiceData.infoTributaria.codDoc,
      ruc: invoiceData.infoTributaria.ruc,
      environment: invoiceData.infoTributaria.ambiente,
      establishment: invoiceData.infoTributaria.estab,
      emissionPoint: invoiceData.infoTributaria.ptoEmi,
      sequential: invoiceData.infoTributaria.secuencial,
    })
    Logger.log(accessKey)
    const {
      ambiente,
      tipoEmision,
      razonSocial,
      nombreComercial,
      ruc,
      codDoc,
      estab,
      ptoEmi,
      secuencial,
      dirMatriz,
    } = invoiceData.infoTributaria

    const infoTributaria = {
      ambiente,
      tipoEmision,
      razonSocial,
      nombreComercial,
      ruc,
      claveAcceso: accessKey, // Asegurarse de que claveAcceso esté después de ruc
      codDoc,
      estab,
      ptoEmi,
      secuencial,
      dirMatriz,
    }

    const invoice: InvoiceDto = {
      factura: {
        '@id': 'comprobante',
        '@version': '1.1.0',

        infoTributaria,
        infoFactura: invoiceData.infoFactura,
        detalles: invoiceData.detalles,
        infoAdicional: {
          campoAdicional: [
            {
              '@nombre': 'emailcliente',
              '#': email,
            },
          ],
        },
      },
    }
    const xml = this.generateInvoiceXml(invoice)
    return { xml, accessKey }
  }

  async documentReception(
    stringXML: string,
    receptionUrl: string,
  ): Promise<SRIAuthorizationDto> {
    const params = { xml: Buffer.from(stringXML).toString('base64') }

    const response: SRIAuthorizationDto = await new Promise(
      (resolve, reject) => {
        createClient(receptionUrl, (err: Error, client: Client) => {
          if (err) {
            reject(err)
            return
          }
          client.validarComprobante(params, (err: Error, result: unknown) => {
            if (err) {
              reject(err)
              return
            }
            resolve(result as SRIAuthorizationDto)
          })
        })
      },
    )

    return response
  }

  async documentAuthorization(
    accessKey: string,
    authorizationUrl: string,
  ): Promise<SRIResponseDto> {
    const params = { claveAccesoComprobante: accessKey }

    const response: any = await new Promise((resolve, reject) => {
      createClient(authorizationUrl, (err: Error, client: Client) => {
        if (err) {
          reject(err)
          return
        }
        client.autorizacionComprobante(
          params,
          (err: Error, result: unknown) => {
            if (err) {
              reject(err)
              return
            }
            resolve(result)
          },
        )
      })
    })
    // Manejar si la respuesta viene como un arreglo
    return Array.isArray(response) ? response[0] : response
  }

  async documentAuthorizationWithRetries(
    accessKey: string,
    authorizationUrl: string,
    retries = 10, // Aumentado de 5 a 10
    delayMs = 3000,
  ) {
    let lastAuth: any = null
    for (let i = 0; i < retries; i++) {
      const response = await this.documentAuthorization(
        accessKey,
        authorizationUrl,
      )
      
      // Manejar si la respuesta viene como un arreglo
      lastAuth = Array.isArray(response) ? response[0] : response
      
      const respuesta = lastAuth?.RespuestaAutorizacionComprobante
      const autorizaciones = respuesta?.autorizaciones?.autorizacion
      
      // Si número de comprobantes es "0" o autorizaciones es null, seguimos reintentando
      if (respuesta?.numeroComprobantes === '0' || !autorizaciones) {
        Logger.log(`[Intento ${i + 1}/${retries}] Aún no hay respuesta de autorización para la clave: ${accessKey}`)
        await new Promise((res) => setTimeout(res, delayMs))
        continue
      }

      // Normalizar autorizacion (puede ser array u objeto)
      const auth = Array.isArray(autorizaciones) ? autorizaciones[0] : autorizaciones
      
      if (auth.estado === 'AUTORIZADO') {
        return lastAuth
      }
      
      // Si el SRI ya devolvió un error definitivo, paramos
      if (auth.estado === 'RECHAZADA' || auth.estado === 'DEVUELTA') {
        return lastAuth
      }

      await new Promise((res) => setTimeout(res, delayMs))
    }

    return lastAuth
  }
}
