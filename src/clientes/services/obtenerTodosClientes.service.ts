import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ObtenerTodosClientesService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async obtenerTodos() {
    return await this.prisma.cLIENTES.findMany({
      select: {
        IDENTIFICACION: true,
        RAZON_SOCIAL: true,
        NOMBRE_COMERCIAL: true,
        DIRECCION: true,
        TELEFONO1: true,
        TELEFONO2: true,
        CORREO: true,
        PROVINCIA: true,
        CIUDAD: true,
        PARROQUIA: true,
        FECHA_CREACION: true,
      },
      orderBy: {
        FECHA_CREACION: 'desc',
      },
    })
  }
}
