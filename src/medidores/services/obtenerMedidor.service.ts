// filepath: c:\Users\edder\OneDrive\Escritorio\Junta Final\JuntaAgua\src\medidores\services\obtenerMedidor.service.ts
import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ObtenerMedidorService {
  constructor(private readonly prisma: PrismaClient) {}
  async obtenerMedidorPorId(id: string | number) {
    if (!id) {
      throw new Error('El ID del medidor es requerido.')
    }

    // Convertir el ID a número entero
    const medidorId = typeof id === 'string' ? parseInt(id, 10) : id

    const medidor = await this.prisma.mEDIDORES.findUnique({
      where: {
        ID: medidorId,
      },
      include: {
        cliente: true, // Incluye los datos del cliente relacionado
      },
    })

    if (!medidor) {
      throw new Error('Medidor no encontrado.')
    }

    return [medidor]
  }
}
