import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class BuscarProductoPorDescripcionService {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarProductoPorDescripcion(descripcion: string) {
    const q = descripcion.trim()
    return this.prisma.pRODUCTOS.findMany({
      where: {
        DESCRIPCION: { contains: q },
      },
      orderBy: { FECHA_CREACION: 'desc' },
    })
  }
}
