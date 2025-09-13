import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class BuscarProductoPorCodigoService {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarProductoPorCodigo(codigo: string) {
    return this.prisma.pRODUCTOS.findMany({
      where: {
        CODIGO: {
          equals: codigo.trim().toUpperCase(),
        },
      },
    })
  }
}
