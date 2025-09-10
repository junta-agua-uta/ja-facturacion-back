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

    const response: SRIResponseDto = await new Promise((resolve, reject) => {
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
            resolve(result as SRIResponseDto)
          },
        )
      })
    })

    return response
  }
}
