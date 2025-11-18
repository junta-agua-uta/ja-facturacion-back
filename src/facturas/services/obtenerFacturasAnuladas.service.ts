import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ObtenerFacturasAnuladasService {
  private readonly logger = new Logger(ObtenerFacturasAnuladasService.name)

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Listar solo las facturas anuladas con paginación
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @returns Lista paginada de facturas anuladas
   */
  async obtenerFacturasAnuladas(page: number = 1, limit: number = 10) {
    try {
      const safePage = Math.max(1, page)
      const safeLimit = Math.max(1, limit)
      const skip = (safePage - 1) * safeLimit

      // Filtrar solo las que tienen ESTADO_FACTURA = 'ANULADO'
      const [total, facturas] = await Promise.all([
        this.prisma.fACTURAS.count({
          where: { ESTADO_FACTURA: 'ANULADO' },
        }),
        this.prisma.fACTURAS.findMany({
          where: { ESTADO_FACTURA: 'ANULADO' },
          skip,
          take: safeLimit,
          orderBy: { FECHA_EMISION: 'desc' },
          select: {
            ID: true,
            SECUENCIA: true,
            FECHA_EMISION: true,
            FECHA_AUTORIZACION: true,
            ESTADO_FACTURA: true,
            CLAVE_ACCESO: true,
            TOTAL: true,
            cliente: {
              select: {
                IDENTIFICACION: true,
                RAZON_SOCIAL: true,
                NOMBRE_COMERCIAL: true,
              },
            },
            sucursal: {
              select: {
                NOMBRE: true,
              },
            },
          },
        }),
      ])

      // Retornar las facturas anuladas directamente

      return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        data: facturas,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error('Error al listar facturas anuladas: ' + msg)
      throw new Error('Error al listar facturas anuladas: ' + msg)
    }
  }
}
