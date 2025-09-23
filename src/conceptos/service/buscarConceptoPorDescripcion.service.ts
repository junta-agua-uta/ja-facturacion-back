import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class BuscarConceptoPorDescripcionService {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorDescripcion(descripcion: string) {
    const q = (descripcion ?? '').trim()
    if (!q) {
      return []
    }

    const conceptos = await this.prisma.cONCEPTOS.findMany({
      where: {
        ESTADO: true,
        DESCRIPCION: {
          contains: q,
        },
      },
      orderBy: { FECHA_CREACION: 'desc' },
    })

    return conceptos.map((row) => ({
      id: String(row.ID),
      codigo: row.CODIGO,
      codInterno: row.COD_INTERNO ?? '',
      desc: row.DESCRIPCION,
      precioBase: row.PRECIO_BASE != null ? Number(row.PRECIO_BASE) : undefined,
      requiereMes: row.REQUIERE_MES ?? false,
    }))
  }
}
