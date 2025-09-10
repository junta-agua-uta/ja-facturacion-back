import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class BuscarClientePorCedulaService {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarClientePorCedula(cedula: string) {
    const cliente = await this.prisma.cLIENTES.findMany({
      where: {
        IDENTIFICACION: {
          equals: cedula.toLowerCase(),
        },
      },
    })
    return cliente
  }
}
