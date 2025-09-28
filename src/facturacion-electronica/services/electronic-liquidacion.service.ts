import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import * as xml2js from 'xml2js'
import { SignInvoiceService } from './sign-invoice.service'
import { GenerateLiquidacionCompraService } from './generate-liquidacion-compra.service'
import { GenerateInvoiceService } from './generate-invoice.service'
import { LiquidacionCompraInputDto } from '../dto/liquidacion-compra.dto'
import {
  SRIResponseDto,
  SRIAuthorizationDto,
} from '../interfaces/sri-response.dto'

@Injectable()
export class ElectronicLiquidacionService {
  private readonly logger = new Logger(ElectronicLiquidacionService.name)
  private sriReceptionUrl: string
  private sriAuthorizationUrl: string

  constructor(
    private readonly prisma: PrismaClient,
    private readonly signService: SignInvoiceService,
    private readonly liquidacionService: GenerateLiquidacionCompraService,
    private readonly invoiceService: GenerateInvoiceService,
  ) {
    // Usa TEST por defecto; permite PROD si existen esas variables
    this.sriReceptionUrl =
      process.env.SRI_RECEPTION_URL_TEST || process.env.SRI_RECEPTION_URL || ''
    this.sriAuthorizationUrl =
      process.env.SRI_AUTHORIZATION_URL_TEST ||
      process.env.SRI_AUTHORIZATION_URL ||
      ''
  }

  async enviarAlSRI(data: LiquidacionCompraInputDto, emailProveedor: string) {
    let accessKey = ''
    let liquidacionId: number | null = null

    try {
      this.logger.log('Generando XML de liquidación de compra...')
      const { xml, accessKey: key } =
        this.liquidacionService.generateLiquidacionCompra(data, emailProveedor)
      accessKey = key

      // Guardar liquidación inicial
      const liquidacionDb = await this.prisma.liquidacionCompra.create({
        data: {
          fechaEmision: data.infoLiquidacionCompra.fechaEmision,
          dirEstablecimiento: data.infoLiquidacionCompra.dirEstablecimiento,
          tipoIdentificacionProveedor:
            data.infoLiquidacionCompra.tipoIdentificacionProveedor,
          razonSocialProveedor: data.infoLiquidacionCompra.razonSocialProveedor,
          identificacionProveedor:
            data.infoLiquidacionCompra.identificacionProveedor,
          totalSinImpuestos: data.infoLiquidacionCompra.totalSinImpuestos,
          totalDescuento: data.infoLiquidacionCompra.totalDescuento,
          importeTotal: data.infoLiquidacionCompra.importeTotal,
          moneda: data.infoLiquidacionCompra.moneda,
          xml,
          accessKey,
          estadoSri: 'GENERADO',
          detalles: {
            create: data.detalles.map((d) => ({
              codigoPrincipal: d.codigoPrincipal,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              descuento: d.descuento,
              precioTotalSinImpuesto: d.precioTotalSinImpuesto,
              codigoImpuesto: d.codigoImpuesto,
              codigoPorcentajeImpuesto: d.codigoPorcentajeImpuesto,
              tarifaImpuesto: d.tarifaImpuesto,
              baseImponible: d.baseImponible,
              valorImpuesto: d.valorImpuesto,
            })),
          },
        },
        include: { detalles: true },
      })
      liquidacionId = liquidacionDb.id

      // Reconstruir XML asegurando claveAcceso
      this.logger.log('Reconstruyendo XML antes de firmar...')
      const parser = new xml2js.Parser({ explicitArray: false })
      const parsedXML = await parser.parseStringPromise(liquidacionDb.xml)

      if (!parsedXML?.liquidacionCompra?.infoTributaria) {
        this.logger.error(
          'XML inválido: falta infoTributaria en liquidacionCompra',
        )
        await this.safeUpdateEstado(liquidacionId, 'ERROR_XML')
        return {
          success: false,
          message: 'XML inválido: falta infoTributaria',
          accessKey,
        }
      }

      parsedXML.liquidacionCompra.infoTributaria.claveAcceso = accessKey

      const builder = new xml2js.Builder({
        xmldec: { version: '1.0', encoding: 'UTF-8' },
      })
      const updatedXml: string = builder.buildObject(parsedXML)

      // Firmar (signXml ya inserta X509 si falta y valida)
      this.logger.log('Firmando XML...')
      const p12 = this.signService.getP12Certificate()
      const password = process.env.SIGNATURE_PASSWORD ?? ''
      if (!password) throw new Error('SIGNATURE_PASSWORD no definido')

      // (Opcional) inspeccionar P12
      try {
        const certInfo = this.signService.verifyP12(p12, password)
        this.logger.log(`[P12] subject=${certInfo.subject} alg=${certInfo.alg}`)
      } catch (e: any) {
        this.logger.warn('No se pudo verificar P12: ' + e?.message)
      }

      const signedXml = await this.signService.signXml(
        p12,
        password,
        updatedXml,
      )
      this.logger.log('XML firmado correctamente.')

      // (Opcional) leer datos del certificado embebido
      try {
        const x = await this.signService.checkSigned(signedXml)
        this.logger.log(
          `[SIGN] serial=${x.serialNumber} validFrom=${x.notBefore} validTo=${x.notAfter}`,
        )
      } catch (e: any) {
        this.logger.warn('No se pudo validar X509 embebido: ' + e?.message)
      }

      // Enviar a recepción del SRI
      this.logger.log('Enviando a recepción del SRI...')
      const reception: SRIAuthorizationDto =
        await this.invoiceService.documentReception(
          signedXml,
          this.sriReceptionUrl,
        )

      if (
        !reception ||
        reception.RespuestaRecepcionComprobante.estado !== 'RECIBIDA'
      ) {
        await this.safeUpdateEstado(liquidacionId, 'NO_RECIBIDA')
        return {
          success: false,
          message: 'Error en recepción del SRI',
          detalles: reception?.RespuestaRecepcionComprobante,
          accessKey,
        }
      }

      this.logger.log('Recepción exitosa, consultando autorización...')
      const authorization: SRIResponseDto =
        await this.invoiceService.documentAuthorization(
          accessKey,
          this.sriAuthorizationUrl,
        )
      const autorizacion =
        authorization?.RespuestaAutorizacionComprobante?.autorizaciones
          ?.autorizacion

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        await this.safeUpdateEstado(
          liquidacionId,
          autorizacion?.estado || 'NO_AUTORIZADO',
        )
        return {
          success: false,
          message: 'Documento no autorizado por el SRI',
          detalles: autorizacion,
          accessKey,
        }
      }

      await this.prisma.liquidacionCompra.update({
        where: { id: liquidacionId },
        data: { estadoSri: 'AUTORIZADO', xml: autorizacion.comprobante },
      })

      return {
        success: true,
        message: 'Liquidación autorizada',
        estado: autorizacion.estado,
        accessKey,
        authorizedXml: autorizacion.comprobante,
      }
    } catch (error: any) {
      const msg = error?.message ?? 'Error desconocido'
      this.logger.error('Error al enviar liquidación al SRI: ' + msg)
      if (liquidacionId) {
        await this.safeUpdateEstado(liquidacionId, 'ERROR_FIRMA')
      }
      return {
        success: false,
        message: 'Error al enviar al SRI: ' + msg,
        accessKey,
      }
    }
  }

  async autorizarPorClave(accessKey: string) {
    try {
      const authorization: SRIResponseDto =
        await this.invoiceService.documentAuthorization(
          accessKey,
          this.sriAuthorizationUrl,
        )
      const autorizacion =
        authorization?.RespuestaAutorizacionComprobante?.autorizaciones
          ?.autorizacion

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        return {
          success: false,
          message: 'Documento no autorizado por el SRI',
          detalles: autorizacion,
        }
      }

      return {
        success: true,
        message: 'Documento autorizado por el SRI',
        estado: autorizacion.estado,
        authorizedXml: autorizacion.comprobante,
      }
    } catch (error: any) {
      const msg = error?.message ?? 'Error desconocido'
      this.logger.error('Error al consultar autorización: ' + msg)
      return {
        success: false,
        message: 'Error al consultar autorización: ' + msg,
      }
    }
  }

  async listarLiquidacionesPaginadas(page: number = 1, limit: number = 10) {
    try {
      const safePage = Math.max(1, page)
      const safeLimit = Math.max(1, limit)
      const skip = (safePage - 1) * safeLimit

      const [total, liquidaciones] = await Promise.all([
        this.prisma.liquidacionCompra.count(),
        this.prisma.liquidacionCompra.findMany({
          skip,
          take: safeLimit,
          orderBy: { fechaEmision: 'desc' },
          select: {
            id: true,
            fechaEmision: true,
            razonSocialProveedor: true,
            identificacionProveedor: true,
            importeTotal: true,
            estadoSri: true,
          },
        }),
      ])

      return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        data: liquidaciones,
      }
    } catch (error: any) {
      const msg = error?.message ?? 'Error desconocido'
      this.logger.error('Error al listar liquidaciones: ' + msg)
      throw new Error('Error al listar liquidaciones: ' + msg)
    }
  }

  // ----- helpers -----
  private async safeUpdateEstado(id: number | null, estadoSri: string) {
    if (!id) return
    try {
      await this.prisma.liquidacionCompra.update({
        where: { id },
        data: { estadoSri },
      })
    } catch (e) {
      this.logger.warn(
        'No se pudo actualizar estadoSri: ' + (e as any)?.message,
      )
    }
  }
}
