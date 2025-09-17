import { Injectable, Logger } from '@nestjs/common'
import * as xml2js from 'xml2js'
import { SignInvoiceService } from './sign-invoice.service'
import { GenerateLiquidacionCompraService } from './generate-liquidacion-compra.service'
import { GenerateInvoiceService } from './generate-invoice.service'
import { LiquidacionCompraInputDto } from '../dto/liquidacion-compra.dto'
import { SRIResponseDto, SRIAuthorizationDto } from '../interfaces/sri-response.dto'

@Injectable()
export class ElectronicLiquidacionService {
  private sriReceptionUrl: string
  private sriAuthorizationUrl: string

  constructor(
    private readonly signService: SignInvoiceService,
    private readonly liquidacionService: GenerateLiquidacionCompraService,
    private readonly invoiceService: GenerateInvoiceService,
  ) {
    this.sriReceptionUrl = process.env.SRI_RECEPTION_URL_TEST || ''
    this.sriAuthorizationUrl = process.env.SRI_AUTHORIZATION_URL_TEST || ''
  }

  async enviarAlSRI(data: LiquidacionCompraInputDto, emailProveedor: string) {
    try {
      Logger.log('Generando XML de liquidación de compra...')
      const { xml, accessKey } = this.liquidacionService.generateLiquidacionCompra(
        data,
        emailProveedor,
      )

      Logger.log('Firmando XML...')
      const p12 = this.signService.getP12Certificate()
      const password = process.env.SIGNATURE_PASSWORD
      const signedXml = this.signService.signXml(p12, password, xml)

      Logger.log('Enviando a recepción del SRI...')
      const reception: SRIAuthorizationDto = await this.invoiceService.documentReception(
        signedXml,
        this.sriReceptionUrl,
      )

      if (
        !reception ||
        reception.RespuestaRecepcionComprobante.estado !== 'RECIBIDA'
      ) {
        Logger.error('Recepción no aceptada:', reception?.RespuestaRecepcionComprobante)
        return {
          success: false,
          message: 'Error en recepción del SRI',
          detalles: reception?.RespuestaRecepcionComprobante,
          accessKey,
        }
      }

      Logger.log('Consultando autorización del SRI...')
      const authorization: SRIResponseDto = await this.invoiceService.documentAuthorization(
        accessKey,
        this.sriAuthorizationUrl,
      )

      const autorizacion =
        authorization?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        Logger.error('Documento no autorizado:', autorizacion?.estado)
        return {
          success: false,
          message: 'Documento no autorizado por el SRI',
          detalles: autorizacion,
          accessKey,
        }
      }

      const authorizedXml = autorizacion.comprobante
      return {
        success: true,
        message: 'Liquidación de compra autorizada por el SRI',
        estado: autorizacion.estado,
        accessKey,
        authorizedXml,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      Logger.error('Error al enviar liquidación al SRI: ' + msg)
      return { success: false, message: 'Error al enviar al SRI: ' + msg }
    }
  }

  async autorizarPorClave(accessKey: string) {
    try {
      Logger.log('Consultando autorización del SRI...')
      const authorization: SRIResponseDto = await this.invoiceService.documentAuthorization(
        accessKey,
        this.sriAuthorizationUrl,
      )
      const autorizacion =
        authorization?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        return {
          success: false,
          message: 'Documento no autorizado por el SRI',
          detalles: autorizacion,
        }
      }
      const authorizedXml = autorizacion.comprobante
      return {
        success: true,
        message: 'Documento autorizado por el SRI',
        estado: autorizacion.estado,
        authorizedXml,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      Logger.error('Error al consultar autorización: ' + msg)
      return { success: false, message: 'Error al consultar autorización: ' + msg }
    }
  }
}


