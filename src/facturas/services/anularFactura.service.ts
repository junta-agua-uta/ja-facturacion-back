import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class AnularFacturaService {
  private readonly logger = new Logger(AnularFacturaService.name)

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Anular una factura
   * @param id - ID de la factura a anular
   * @returns Resultado de la operación
   */
  async anularFactura(id: number) {
    try {
      // Verificar que la factura existe
      const factura = await this.prisma.fACTURAS.findUnique({
        where: { ID: id },
        include: {
          cliente: true,
          sucursal: true,
          usuario: true,
        },
      })

      if (!factura) {
        return {
          success: false,
          message: `No se encontró la factura con ID ${id}`,
        }
      }

      // Verificar que no esté ya anulada
      if (factura.ESTADO_FACTURA === 'ANULADO') {
        return {
          success: false,
          message: 'Esta factura ya ha sido anulada previamente',
          detalles: {
            estadoActual: factura.ESTADO_FACTURA,
          },
        }
      }

      // Validación: solo se pueden anular facturas autorizadas
      if (factura.ESTADO_FACTURA !== 'AUTORIZADO') {
        return {
          success: false,
          message: `No se puede anular una factura con estado "${factura.ESTADO_FACTURA}". Solo se pueden anular facturas autorizadas.`,
        }
      }

      // Realizar la anulación actualizando solo ESTADO_FACTURA
      const facturaAnulada = await this.prisma.fACTURAS.update({
        where: { ID: id },
        data: {
          ESTADO_FACTURA: 'ANULADO',
        },
        include: {
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
      })

      this.logger.log(`Factura ${id} anulada exitosamente`)

      return {
        success: true,
        message: 'Factura anulada exitosamente',
        data: {
          id: facturaAnulada.ID,
          claveAcceso: facturaAnulada.CLAVE_ACCESO,
          fechaEmision: facturaAnulada.FECHA_EMISION,
          clienteNombre: facturaAnulada.cliente.RAZON_SOCIAL,
          clienteIdentificacion: facturaAnulada.cliente.IDENTIFICACION,
          total: facturaAnulada.TOTAL,
          estadoFactura: facturaAnulada.ESTADO_FACTURA,
        },
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error(`Error al anular factura ${id}: ${msg}`)
      return {
        success: false,
        message: `Error al anular factura: ${msg}`,
      }
    }
  }
}
