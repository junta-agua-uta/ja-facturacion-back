import { EstadoPeriodo, PrismaClient } from '@prisma/client'
import { Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class PeriodosContablesService {
  constructor(private readonly prisma: PrismaClient) {}

  async listarPeriodos(
    page: number,
    limit: number,
    empresaId: number,
    estado?: EstadoPeriodo,
  ) {
    const skip = (page - 1) * limit

    const where = {
      empresaId,
      ...(estado ? { estado } : {}),
    }

    const [total, data] = await Promise.all([
      this.prisma.periodoContable.count({ where }),
      this.prisma.periodoContable.findMany({
        where,
        orderBy: { fechaInicio: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    }
  }

  async crearPeriodo(empresaId: number, data: any) {
    const fInicio = new Date(data.fechaInicio)
    const fFin = new Date(data.fechaFin)

    if (fInicio >= fFin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser cronológicamente anterior a la fecha de fin.',
      )
    }

    const solapamiento = await this.prisma.periodoContable.findFirst({
      where: {
        empresaId,
        OR: [{ fechaInicio: { lte: fFin }, fechaFin: { gte: fInicio } }],
      },
    })

    if (solapamiento) {
      throw new BadRequestException(
        `El rango ingresado entra en conflicto cronológico con el periodo existente: ${solapamiento.nombre}`,
      )
    }

    return this.prisma.periodoContable.create({
      data: {
        empresaId,
        nombre: data.nombre,
        fechaInicio: fInicio,
        fechaFin: fFin,
        estado: 'ABIERTO',
      },
    })
  }

  async bloquearPeriodo(periodoId: number, empresaId: number) {
    const periodo = await this.prisma.periodoContable.findUnique({
      where: { id: periodoId, empresaId },
    })

    if (!periodo) {
      throw new BadRequestException(
        'El periodo contable no existe o no pertenece a la empresa.',
      )
    }

    if (periodo.estado === 'CERRADO') return periodo

    const asientosPendientes = await this.prisma.asiento.count({
      where: { periodoId, estado: 'PENDIENTE' },
    })

    if (asientosPendientes > 0) {
      throw new BadRequestException(
        `Acción denegada: El periodo posee ${asientosPendientes} asientos en estado PENDIENTE. Apruébelos o elimínelos antes del cierre.`,
      )
    }

    return this.prisma.periodoContable.update({
      where: { id: periodoId },
      data: { estado: 'CERRADO' },
    })
  }

  // Esto es una cuestion demasiado rara
  async desbloquearPeriodo(periodoId: number, empresaId: number) {
    const periodo = await this.prisma.periodoContable.findUnique({
      where: { id: periodoId, empresaId },
    })

    if (!periodo) {
      throw new BadRequestException(
        'El periodo contable no existe o no pertenece a la empresa.',
      )
    }

    if (periodo.estado === 'ABIERTO') return periodo

    return this.prisma.periodoContable.update({
      where: { id: periodoId },
      data: { estado: 'ABIERTO' },
    })
  }
}
