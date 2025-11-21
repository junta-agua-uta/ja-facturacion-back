import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ObtenerTodasLasFacturasService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerTodasFacturas(page: number = 1, limit: number = 10) {
    if (page < 1) page = 1
    if (limit < 1) limit = 10

    // Calcular el offset
    const offset = (page - 1) * limit

    // Consultar las facturas con paginación
    const [facturas, totalItems] = await Promise.all([
      this.prisma.fACTURAS.findMany({
        skip: offset,
        take: limit,
        include: {
          cliente: true,
          usuario: true,
          sucursal: true,
        },
        orderBy: {
          ID: 'desc',
        },
      }),
      this.prisma.fACTURAS.count(),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data: facturas,
      totalItems,
      totalPages,
      currentPage: page,
    }
  }

  async obtenerTodasSinPaginacion() {
    return this.prisma.fACTURAS.findMany({
      include: {
        cliente: true,
        usuario: true,
        sucursal: true,
      },
    })
  }
}
