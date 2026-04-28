import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}
  async listarUsuarios(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [total, data] = await Promise.all([
      this.prisma.uSUARIOS.count(),
      this.prisma.uSUARIOS.findMany({
        skip,
        take: limit,
        orderBy: { ID: 'desc' },
        include: {
          empresa: true, // útil para frontend
        },
      }),
    ])

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    }
  }

  async listarUsuariosPorEmpresa(
    empresaId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit

    const where = { empresaId }

    const [total, data] = await Promise.all([
      this.prisma.uSUARIOS.count({ where }),
      this.prisma.uSUARIOS.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ID: 'desc' },
        include: {
          empresa: true,
        },
      }),
    ])

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    }
  }
}
