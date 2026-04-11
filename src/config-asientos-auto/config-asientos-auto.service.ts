import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
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

  async actualizarConfiguracion(tipoTransaccion: string, empresaId: number, data: any) {
    const configuracionOriginal = await this.prisma.configAsientoAuto.findUnique({
      where: { empresaId_tipoTransaccion: { empresaId, tipoTransaccion } }
    })

    if (!configuracionOriginal) {
      throw new NotFoundException(`La configuración automática para la transacción ${tipoTransaccion} no existe.`)
    }

    const cuentaIds: number[] = [];
    if (data.cuentaDebeId) cuentaIds.push(Number(data.cuentaDebeId));
    if (data.cuentaHaberId) cuentaIds.push(Number(data.cuentaHaberId));
    if (data.cuentaIvaId) cuentaIds.push(Number(data.cuentaIvaId));

    if (cuentaIds.length > 0) {
      const cuentas = await this.prisma.planCuentas.findMany({
        where: { id: { in: cuentaIds }, empresaId },
      })

      if (cuentas.length !== cuentaIds.length) {
        throw new BadRequestException('Una o más cuentas proporcionadas no existen o no pertenecen a esta empresa.')
      }

      const cuentasInvalidas = cuentas.filter((c) => !c.esDetalle);
      if (cuentasInvalidas.length > 0) {
        throw new BadRequestException('Vulnerabilidad detectada: Las cuentas asignadas para contabilidad automática deben ser transaccionales (esDetalle: true).')
      }
    }

    return this.prisma.configAsientoAuto.update({
      where: { 
        empresaId_tipoTransaccion: {
          empresaId,
          tipoTransaccion
        }
      },
      data: {
        cuentaDebeId: data.cuentaDebeId,
        cuentaHaberId: data.cuentaHaberId,
        cuentaIvaId: data.cuentaIvaId !== undefined ? data.cuentaIvaId : undefined,
      }
    })
  }
}