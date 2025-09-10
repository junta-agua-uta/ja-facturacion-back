import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ObtenerFacturaPorCedulaService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerFacturasPorCedula(identificacion: string): Promise<unknown[]> {
    const cliente = await this.prisma.cLIENTES.findUnique({
      where: { IDENTIFICACION: identificacion },
      include: {
        FACTURAS: {
          include: {
            sucursal: true,
            DETALLES_FACTURA: {
              include: {
                razon: true,
              },
            },
          },
        },
      },
    })

    if (!cliente) {
      return []
    }

    return cliente.FACTURAS.map((factura) => ({
      ambiente: 2,
      razonSocialComprador: cliente.RAZON_SOCIAL,
      identificacionComprador: cliente.IDENTIFICACION,
      totalSinImpuestos: factura.VALOR_SIN_IMPUESTO,
      correo: cliente.CORREO,
      pto_emision: factura.sucursal?.PUNTO_EMISION,
      secuencial: factura.SECUENCIA,
      fechaEmision: factura.FECHA_EMISION?.toISOString().split('T')[0],
      direccionComprador: cliente.DIRECCION,
      baseImponible: factura.VALOR_SIN_IMPUESTO,
      importeTotal: factura.TOTAL,
      detalles: factura.DETALLES_FACTURA.map((detalle) => ({
        codigoAuxiliar: detalle.razon?.CODIGO,
        descripcion: detalle.DESCRIPCION,
        cantidad: detalle.CANTIDAD,
        precioUnitario: detalle.PRECIO_IVA,
        precioTotalSinImpuesto: detalle.SUBTOTAL,
        baseImponible: detalle.SUBTOTAL,
        descuento: detalle.DESCUENTO,
      })),
    }))
  }
}
