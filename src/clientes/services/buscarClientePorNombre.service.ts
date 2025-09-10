import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class BuscarClientePorNombreService {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarClientePorNombre(nombre: string) {
    const cliente = await this.prisma.cLIENTES.findMany({
      where: {
        RAZON_SOCIAL: {
          equals: nombre.toLowerCase(),
        },
      },
    })
    return cliente
  }
}
