import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { DateUtil } from 'src/common/utils/date.util'
import { ObtenerConceptosDto } from '../dtos/obtenerConceptos.dto'
import { CrearConceptoDto } from '../dtos/crearConcepto.dto'
import { EditarConceptoDto } from '../dtos/editarConcepto.dto'
import { Concepto } from '../models/concepto.model'

@Injectable()
export class CrudConceptoService {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToFront(row: any): Concepto {
    return {
      id: String(row.ID),
      codigo: row.CODIGO,
      codInterno: row.COD_INTERNO ?? '',
      desc: row.DESCRIPCION,
      precioBase: row.PRECIO_BASE != null ? Number(row.PRECIO_BASE) : undefined,
      requiereMes: row.REQUIERE_MES ?? false,
    }
  }

  async obtenerConceptos({
    page = 1,
    limit = 10,
    search,
  }: ObtenerConceptosDto) {
    if (page < 1) page = 1
    if (limit < 1) limit = 10
    const offset = (page - 1) * limit

    const where: any = { ESTADO: true }

    if (search && search.trim() !== '') {
      const q = search.trim()
      const qUpper = q.toUpperCase()
      where.OR = [
        { CODIGO: { contains: qUpper } },
        { COD_INTERNO: { contains: qUpper } },
        { DESCRIPCION: { contains: q } }, // sin mode
      ]
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.cONCEPTOS.findMany({
        skip: offset,
        take: limit,
        where,
        orderBy: { FECHA_CREACION: 'desc' },
      }),
      this.prisma.cONCEPTOS.count({ where }),
    ])

    const totalPages = Math.ceil(totalItems / limit)
    return {
      data: items.map((row) => this.mapToFront(row)),
      totalItems,
      totalPages,
      currentPage: page,
    }
  }

  async crearConcepto(data: CrearConceptoDto) {
    const codigo = data.codigo.trim().toUpperCase()

    const existente = await this.prisma.cONCEPTOS.findFirst({
      where: { CODIGO: codigo },
    })
    if (existente) {
      throw new Error('Ya existe un concepto con el mismo código.')
    }

    const creado = await this.prisma.cONCEPTOS.create({
      data: {
        CODIGO: codigo,
        COD_INTERNO: data.codInterno
          ? data.codInterno.trim().toUpperCase()
          : undefined,
        DESCRIPCION: data.desc.trim(),
        PRECIO_BASE: data.precioBase ?? undefined,
        REQUIERE_MES: data.requiereMes ?? false,
        ESTADO: true,
        FECHA_CREACION: DateUtil?.getCurrentDate?.() ?? new Date(),
      },
    })
    return this.mapToFront(creado)
  }

  async editarConcepto(id: number | string, data: EditarConceptoDto) {
    if (!id) throw new Error('El ID del concepto es requerido.')
    const conceptoId = typeof id === 'string' ? parseInt(id, 10) : id

    const existente = await this.prisma.cONCEPTOS.findUnique({
      where: { ID: conceptoId },
    })
    if (!existente) {
      throw new Error(`El concepto con ID ${conceptoId} no existe.`)
    }

    if (data.codigo) {
      const codigo = data.codigo.trim().toUpperCase()
      const conflicto = await this.prisma.cONCEPTOS.findFirst({
        where: { ID: { not: conceptoId }, CODIGO: codigo },
      })
      if (conflicto) {
        throw new Error('Ya existe un concepto con el mismo código.')
      }
    }

    const actualizado = await this.prisma.cONCEPTOS.update({
      where: { ID: conceptoId },
      data: {
        CODIGO: data.codigo ? data.codigo.trim().toUpperCase() : undefined,
        COD_INTERNO: data.codInterno
          ? data.codInterno.trim().toUpperCase()
          : undefined,
        DESCRIPCION: data.desc?.trim(),
        PRECIO_BASE: data.precioBase,
        REQUIERE_MES: data.requiereMes,
      },
    })
    return this.mapToFront(actualizado)
  }

  async desactivarConcepto(id: number | string) {
    if (!id) throw new Error('El ID del concepto es requerido.')
    const conceptoId = typeof id === 'string' ? parseInt(id, 10) : id

    const existente = await this.prisma.cONCEPTOS.findUnique({
      where: { ID: conceptoId },
    })
    if (!existente) {
      throw new Error(`El concepto con ID ${conceptoId} no existe.`)
    }

    const actualizado = await this.prisma.cONCEPTOS.update({
      where: { ID: conceptoId },
      data: { ESTADO: false },
    })
    return this.mapToFront(actualizado)
  }
}
