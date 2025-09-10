import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ObtenerFacturaPorIdService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerFacturaPorId(idFactura: number): Promise<unknown> {
    const factura = await this.prisma.fACTURAS.findUnique({
      where: {
        ID: idFactura,
        NOT: {
          ID_USUARIO: 6,
        },
      },
      include: {
        cliente: true,
        sucursal: true,
        DETALLES_FACTURA: {
          include: {
            razon: true,
          },
        },
      },
    })

    if (!factura) {
      return []
    }

    return factura
  }
}
