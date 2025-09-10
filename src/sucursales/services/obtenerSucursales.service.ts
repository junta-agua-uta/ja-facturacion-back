import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class SucursalesService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerTodasSucursales(page: number = 1, limit: number = 10) {
    if (page < 1) page = 1
    if (limit < 1) limit = 10
    const offset = (page - 1) * limit

    const [sucursales, totalItems] = await Promise.all([
      this.prisma.sUCURSALES.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          ID: 'asc',
        },
      }),
      this.prisma.sUCURSALES.count(),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data: sucursales,
      totalItems,
      totalPages,
      currentPage: page,
    }
  }
}
