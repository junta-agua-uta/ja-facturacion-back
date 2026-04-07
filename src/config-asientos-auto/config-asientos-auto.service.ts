import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ConfigAsientosAutoService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerConfiguracion(empresaId: number, tipoTransaccion?: string) {
    if (tipoTransaccion) {
      const configuracion = await this.prisma.configAsientoAuto.findFirst({
        where: {
          empresaId,
          tipoTransaccion,
          activo: true,
        },
        include: {
          cuentaDebe: true,
          cuentaHaber: true,
          cuentaIva: true,
        },
      })

      if (!configuracion) {
        throw new NotFoundException(
          `No existe configuracion activa para ${tipoTransaccion}`,
        )
      }

      return configuracion
    }

    return this.prisma.configAsientoAuto.findMany({
      where: {
        empresaId,
        activo: true,
      },
      orderBy: { tipoTransaccion: 'asc' },
      include: {
        cuentaDebe: true,
        cuentaHaber: true,
        cuentaIva: true,
      },
    })
  }
}