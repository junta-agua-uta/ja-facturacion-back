import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class BuscarConceptoPorCodigoService {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorCodigo(codigo: string) {
    const q = (codigo ?? '').trim()
    if (!q) return []

    const qUpper = q.toUpperCase()

    const conceptos = await this.prisma.cONCEPTOS.findMany({
      where: {
        ESTADO: true,
        OR: [
          { CODIGO: { contains: qUpper } },
          { COD_INTERNO: { contains: qUpper } },
        ],
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
