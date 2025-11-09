import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import * as xml2js from 'xml2js'
import { SignLiquidacionService } from './sign-liquidation.service'
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
    private readonly signLiquidacionService: SignLiquidacionService,
    private readonly liquidacionService: GenerateLiquidacionCompraService,
    private readonly invoiceService: GenerateInvoiceService,
  ) {
    this.sriReceptionUrl = process.env.SRI_RECEPTION_URL_TEST || ''
    this.sriAuthorizationUrl = process.env.SRI_AUTHORIZATION_URL_TEST || ''
  }

  // --- Helpers de validación de identificación ---
  private esCedulaValida(ec: string): boolean {
    if (!/^\d{10}$/.test(ec)) return false
    const prov = parseInt(ec.substring(0, 2), 10)
    if (prov < 1 || prov > 24) return false
    const d = ec.split('').map(Number)
    const verificador = d.pop()!
    let suma = 0
    d.forEach((n, i) => {
      let v = n
      if (i % 2 === 0) {
        v = n * 2
        if (v > 9) v -= 9
      }
      suma += v
    })
    const mod = suma % 10
    const dig = mod === 0 ? 0 : 10 - mod
    return dig === verificador
  }

  private esRucBasicoValido(ruc: string): boolean {
    // Validación básica suficiente para pruebas
    return /^\d{13}$/.test(ruc) && ruc.endsWith('001')
  }

  async enviarAlSRI(data: LiquidacionCompraInputDto, emailProveedor: string) {
    try {
      // 1) Obtener EMISOR desde BD
      const emisorRuc = process.env.EMISOR_RUC
      const emisor = emisorRuc
        ? await this.prisma.emisor.findUnique({ where: { ruc: emisorRuc } })
        : await this.prisma.emisor.findFirst({ where: { activo: true } })

      if (!emisor) {
        this.logger.error(
          'No se encontró Emisor (revisa tabla "emisor" o EMISOR_RUC)',
        )
        return { success: false, message: 'No hay Emisor configurado' }
      }

      // 1.b) Validación de identificación del proveedor (antes de secuencial)
      const tipoId = data.infoLiquidacionCompra.tipoIdentificacionProveedor
      const identificacion = data.infoLiquidacionCompra.identificacionProveedor

      if (tipoId === '05') {
        if (!this.esCedulaValida(identificacion)) {
          return {
            success: false,
            message: 'Identificación de proveedor inválida (cédula).',
            detalles: 'La cédula no cumple el dígito verificador.',
          }
        }
      } else if (tipoId === '04') {
        if (!this.esRucBasicoValido(identificacion)) {
          return {
            success: false,
            message: 'Identificación de proveedor inválida (RUC).',
            detalles: 'El RUC debe tener 13 dígitos y terminar en 001.',
          }
        }
      }

      // 2) Obtener el siguiente SECUENCIAL (codDoc '03') en una transacción
      const { nextSeq } = await this.prisma.$transaction(async (tx) => {
        // a) Máximo secuencial en tu BD para esta serie
        const currentMax = await tx.liquidacionCompra.aggregate({
          _max: { secuencial: true },
          where: {
            estab: emisor.estab,
            ptoEmi: emisor.ptoEmi,
            emisorId: emisor.id,
          },
        })
        const desiredNext = (currentMax._max.secuencial ?? 0) + 1

        // b) Ajustar contador local en secuencialDoc
        const key = { codDoc: '03', estab: emisor.estab, ptoEmi: emisor.ptoEmi }
        const existing = await tx.secuencialDoc.findUnique({
          where: { uniq_doc_serie: key },
        })

        let nextSeq: number
        if (!existing) {
          const created = await tx.secuencialDoc.create({
            data: { ...key, lastSeq: desiredNext },
          })
          nextSeq = created.lastSeq
        } else if (existing.lastSeq < desiredNext) {
          const updated = await tx.secuencialDoc.update({
            where: { uniq_doc_serie: key },
            data: { lastSeq: desiredNext },
          })
          nextSeq = updated.lastSeq
        } else {
          const updated = await tx.secuencialDoc.update({
            where: { uniq_doc_serie: key },
            data: { lastSeq: { increment: 1 } },
          })
          nextSeq = updated.lastSeq
        }
        return { nextSeq }
      })

      const secuencialNumber = nextSeq
      const secuencialStr = secuencialNumber.toString().padStart(9, '0')

      // 3) Generar XML + claveAcceso usando EMISOR y SECUENCIAL
      this.logger.log('Generando XML de liquidación de compra...')
      const { xml, accessKey } =
        this.liquidacionService.generateLiquidacionCompra(
          data,
          emailProveedor,
          {
            emisor,
            secuencial: secuencialStr,
            ambiente: process.env.AMBIENTE || '1',
          },
        )

      // 4) Guardar liquidación en BD conectando el emisor
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

          // Serie / Secuencial usados (numérico en BD)
          estab: emisor.estab,
          ptoEmi: emisor.ptoEmi,
          secuencial: secuencialNumber,

          xml,
          accessKey,
          estadoSri: 'GENERADO',

          emisor: { connect: { id: emisor.id } },

          detalles: {
            create: data.detalles.map((d) => ({
              codigoPrincipal: d.codigoPrincipal,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              descuento: d.descuento ?? 0,
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

      // --- Reconstrucción, firma, envío y autorización ---
      this.logger.log('Reconstruyendo XML antes de firmar...')
      const parser = new xml2js.Parser({ explicitArray: false })
      const parsedXML = await parser.parseStringPromise(xml)

      if (!parsedXML?.liquidacionCompra?.infoTributaria) {
        this.logger.error(
          'XML inválido: falta infoTributaria en liquidacionCompra',
        )
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

      this.logger.log('Firmando XML...')
      const p12 = this.signLiquidacionService.getP12Certificate()
      const password = process.env.SIGNATURE_PASSWORD
      const signedXml = this.signLiquidacionService.signXml(
        p12,
        password,
        updatedXml,
      )
      this.logger.log('XML firmado correctamente.')

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
        await this.prisma.liquidacionCompra.update({
          where: { id: liquidacionDb.id },
          data: { estadoSri: 'NO_RECIBIDA' },
        })
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
        await this.prisma.liquidacionCompra.update({
          where: { id: liquidacionDb.id },
          data: { estadoSri: autorizacion?.estado || 'NO_AUTORIZADO' },
        })
        return {
          success: false,
          message: 'Documento no autorizado por el SRI',
          detalles: autorizacion,
          accessKey,
        }
      }

      await this.prisma.liquidacionCompra.update({
        where: { id: liquidacionDb.id },
        data: { estadoSri: 'AUTORIZADO', xml: autorizacion.comprobante },
      })

      return {
        success: true,
        message: 'Liquidación autorizada',
        estado: autorizacion.estado,
        accessKey,
        authorizedXml: autorizacion.comprobante,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error('Error al enviar liquidación al SRI: ' + msg)
      return { success: false, message: 'Error al enviar al SRI: ' + msg }
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
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
            accessKey: true,
            estab: true,
            ptoEmi: true,
            secuencial: true,
            updatedAt: true,
          },
        }),
      ])

      // Procesar para agregar información de anulación
      const liquidacionesConAnulacion = liquidaciones.map((liq) => ({
        ...liq,
        anulado: liq.estadoSri === 'ANULADO',
      }))

      return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        data: liquidacionesConAnulacion,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error('Error al listar liquidaciones: ' + msg)
      throw new Error('Error al listar liquidaciones: ' + msg)
    }
  }

  /**
   * Listar solo las liquidaciones anuladas con paginación
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @returns Lista paginada de liquidaciones anuladas con sus metadatos de anulación
   */
  async listarLiquidacionesAnuladas(page: number = 1, limit: number = 10) {
    try {
      const safePage = Math.max(1, page)
      const safeLimit = Math.max(1, limit)
      const skip = (safePage - 1) * safeLimit

      // Filtrar solo las que tienen estadoSri = 'ANULADO'
      const [total, liquidaciones] = await Promise.all([
        this.prisma.liquidacionCompra.count({
          where: { estadoSri: 'ANULADO' },
        }),
        this.prisma.liquidacionCompra.findMany({
          where: { estadoSri: 'ANULADO' },
          skip,
          take: safeLimit,
          orderBy: { updatedAt: 'desc' }, // Ordenar por fecha de actualización (anulación)
          select: {
            id: true,
            fechaEmision: true,
            razonSocialProveedor: true,
            identificacionProveedor: true,
            importeTotal: true,
            estadoSri: true,
            accessKey: true,
            estab: true,
            ptoEmi: true,
            secuencial: true,
            updatedAt: true,
            xml: true, // Necesario para extraer metadatos
          },
        }),
      ])

      // Procesar para agregar información de anulación extraída del XML
      const liquidacionesConMetadatos = liquidaciones.map((liq) => {
        let metadatosAnulacion = null

        // Extraer metadatos del XML
        if (liq.xml?.includes('<!-- ANULACION:')) {
          try {
            const match = liq.xml.match(/<!-- ANULACION: ({[\s\S]*?}) -->/)
            if (match && match[1]) {
              metadatosAnulacion = JSON.parse(match[1])
            }
          } catch (e) {
            this.logger.warn(
              `No se pudieron extraer metadatos de anulación para liquidación ${liq.id}`,
            )
          }
        }

        // Retornar sin el XML completo (muy grande)
        const { xml, ...liquidacionSinXml } = liq

        return {
          ...liquidacionSinXml,
          anulado: true,
          metadatosAnulacion,
        }
      })

      return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        data: liquidacionesConMetadatos,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error('Error al listar liquidaciones anuladas: ' + msg)
      throw new Error('Error al listar liquidaciones anuladas: ' + msg)
    }
  }

  /**
   * Devuelve todas las liquidaciones con la info necesaria para exportar a Excel.
   * Ajusta los select si tu servicio de Excel requiere más/menos campos.
   */
  async obtenerTodasLasLiquidacionesParaExcel() {
    const liquidaciones = await this.prisma.liquidacionCompra.findMany({
      orderBy: { fechaEmision: 'desc' },
      include: {
        emisor: {
          select: {
            id: true,
            ruc: true,
            razonSocial: true,
            estab: true,
            ptoEmi: true,
          },
        },
        detalles: true,
      },
    })

    return liquidaciones
  }

  /**
   * Anular una liquidación de compra
   * @param id - ID de la liquidación a anular
   * @param motivoAnulacion - Motivo de la anulación
   * @param usuarioAnulacion - Usuario que realiza la anulación (opcional)
   * @returns Resultado de la operación
   */
  async anularLiquidacion(
    id: number,
    motivoAnulacion: string,
    usuarioAnulacion?: string,
  ) {
    try {
      // Verificar que la liquidación existe
      const liquidacion = await this.prisma.liquidacionCompra.findUnique({
        where: { id },
        include: { emisor: true },
      })

      if (!liquidacion) {
        return {
          success: false,
          message: `No se encontró la liquidación con ID ${id}`,
        }
      }

      // Verificar que no esté ya anulada (revisando estadoSri)
      if (liquidacion.estadoSri === 'ANULADO') {
        return {
          success: false,
          message: 'Esta liquidación ya ha sido anulada previamente',
          detalles: {
            estadoActual: liquidacion.estadoSri,
          },
        }
      }

      // Validación: solo se pueden anular liquidaciones autorizadas
      if (liquidacion.estadoSri !== 'AUTORIZADO') {
        return {
          success: false,
          message: `No se puede anular una liquidación con estado "${liquidacion.estadoSri}". Solo se pueden anular liquidaciones autorizadas.`,
        }
      }

      const fechaAnulacion = new Date()
      const usuario = usuarioAnulacion || 'Sistema'

      // Crear metadatos de anulación como comentario XML
      const metadatosAnulacion = `\n<!-- ANULACION: {
  "motivoAnulacion": "${motivoAnulacion.replace(/"/g, '\\"')}",
  "usuarioAnulacion": "${usuario}",
  "fechaAnulacion": "${fechaAnulacion.toISOString()}",
  "estadoAnterior": "${liquidacion.estadoSri}"
} -->`

      // Actualizar XML con metadatos de anulación si existe
      const xmlActualizado = liquidacion.xml
        ? liquidacion.xml + metadatosAnulacion
        : metadatosAnulacion

      // Realizar la anulación actualizando solo estadoSri y xml
      const liquidacionAnulada = await this.prisma.liquidacionCompra.update({
        where: { id },
        data: {
          estadoSri: 'ANULADO',
          xml: xmlActualizado,
          updatedAt: fechaAnulacion,
        },
        include: {
          emisor: {
            select: {
              ruc: true,
              razonSocial: true,
              estab: true,
              ptoEmi: true,
            },
          },
        },
      })

      this.logger.log(
        `Liquidación ${id} anulada exitosamente. Motivo: ${motivoAnulacion}`,
      )

      return {
        success: true,
        message: 'Liquidación anulada exitosamente',
        data: {
          id: liquidacionAnulada.id,
          accessKey: liquidacionAnulada.accessKey,
          fechaEmision: liquidacionAnulada.fechaEmision,
          razonSocialProveedor: liquidacionAnulada.razonSocialProveedor,
          importeTotal: liquidacionAnulada.importeTotal,
          estadoSri: liquidacionAnulada.estadoSri,
          motivoAnulacion,
          fechaAnulacion: fechaAnulacion.toISOString(),
          usuarioAnulacion: usuario,
        },
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error(`Error al anular liquidación ${id}: ${msg}`)
      return {
        success: false,
        message: `Error al anular liquidación: ${msg}`,
      }
    }
  }

  /**
   * Obtener liquidación por ID con detalles completos
   * Extrae información de anulación del XML si existe
   */
  async obtenerLiquidacionPorId(id: number) {
    try {
      const liquidacion = await this.prisma.liquidacionCompra.findUnique({
        where: { id },
        include: {
          emisor: {
            select: {
              ruc: true,
              razonSocial: true,
              estab: true,
              ptoEmi: true,
            },
          },
          detalles: true,
        },
      })

      if (!liquidacion) {
        return {
          success: false,
          message: `No se encontró la liquidación con ID ${id}`,
        }
      }

      // Extraer metadatos de anulación del XML si está anulada
      let metadatosAnulacion = null
      if (
        liquidacion.estadoSri === 'ANULADO' &&
        liquidacion.xml?.includes('<!-- ANULACION:')
      ) {
        try {
          const match = liquidacion.xml.match(
            /<!-- ANULACION: ({[\s\S]*?}) -->/,
          )
          if (match && match[1]) {
            metadatosAnulacion = JSON.parse(match[1])
          }
        } catch (e) {
          this.logger.warn(
            `No se pudieron extraer metadatos de anulación para liquidación ${id}`,
          )
        }
      }

      return {
        success: true,
        data: {
          ...liquidacion,
          metadatosAnulacion,
        },
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error(`Error al obtener liquidación ${id}: ${msg}`)
      return {
        success: false,
        message: `Error al obtener liquidación: ${msg}`,
      }
    }
  }
}
