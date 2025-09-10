import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
@Injectable()
export class RazonesService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerRazones(page: number = 1, limit: number = 10) {
    if (page < 1) page = 1
    if (limit < 1) limit = 10
    const offset = (page - 1) * limit

    const [razones, totalItems] = await Promise.all([
      this.prisma.rAZONES.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          ID: 'asc',
        },
      }),
      this.prisma.rAZONES.count(),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data: razones,
      totalItems,
      totalPages,
      currentPage: page,
    }
  }
}
