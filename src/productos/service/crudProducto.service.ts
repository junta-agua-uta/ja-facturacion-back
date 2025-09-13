import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { DateUtil } from 'src/common/utils/date.util'
import { ObtenerProductosDto } from '../dtos/obtenerProductos.dto'
import { CrearProductoDto } from '../dtos/crearProducto.dto'
import { EditarProductoDto } from '../dtos/editarProducto.dto'

@Injectable()
export class CrudProductoService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerProductos({
    page = 1,
    limit = 10,
    search,
  }: ObtenerProductosDto) {
    if (page < 1) page = 1
    if (limit < 1) limit = 10
    const offset = (page - 1) * limit

    const where =
      search && search.trim() !== ''
        ? {
            OR: [
              { CODIGO: { contains: search.trim().toUpperCase() } },
              { DESCRIPCION: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : undefined

    const [items, totalItems] = await Promise.all([
      this.prisma.pRODUCTOS.findMany({
        skip: offset,
        take: limit,
        where,
        orderBy: { FECHA_CREACION: 'desc' },
      }),
      this.prisma.pRODUCTOS.count({ where }),
    ])

    const totalPages = Math.ceil(totalItems / limit)
    return { data: items, totalItems, totalPages, currentPage: page }
  }

  async crearProducto(data: CrearProductoDto) {
    const codigo = data.codigo.trim().toUpperCase()

    const existente = await this.prisma.pRODUCTOS.findFirst({
      where: { CODIGO: codigo },
    })
    if (existente) {
      throw new Error('Ya existe un producto con el mismo código.')
    }

    const creado = await this.prisma.pRODUCTOS.create({
      data: {
        CODIGO: codigo,
        DESCRIPCION: data.descripcion.trim(),
        ESTADO: data.estado ?? true,
        FECHA_CREACION: DateUtil?.getCurrentDate?.() ?? new Date(),
      },
    })
    return creado
  }

  async editarProducto(id: number | string, data: EditarProductoDto) {
    if (!id) throw new Error('El ID del producto es requerido.')
    const productoId = typeof id === 'string' ? parseInt(id, 10) : id

    const existente = await this.prisma.pRODUCTOS.findUnique({
      where: { ID: productoId },
    })
    if (!existente) {
      throw new Error(`El producto con ID ${productoId} no existe.`)
    }

    if (data.codigo) {
      const codigo = data.codigo.trim().toUpperCase()
      const conflicto = await this.prisma.pRODUCTOS.findFirst({
        where: { ID: { not: productoId }, CODIGO: codigo },
      })
      if (conflicto) {
        throw new Error('Ya existe un producto con el mismo código.')
      }
    }

    const actualizado = await this.prisma.pRODUCTOS.update({
      where: { ID: productoId },
      data: {
        CODIGO: data.codigo ? data.codigo.trim().toUpperCase() : undefined,
        DESCRIPCION: data.descripcion?.trim(),
        ESTADO: data.estado,
      },
    })
    return actualizado
  }

  async desactivarProducto(id: number | string) {
    if (!id) throw new Error('El ID del producto es requerido.')
    const productoId = typeof id === 'string' ? parseInt(id, 10) : id

    const existente = await this.prisma.pRODUCTOS.findUnique({
      where: { ID: productoId },
    })
    if (!existente) {
      throw new Error(`El producto con ID ${productoId} no existe.`)
    }

    return this.prisma.pRODUCTOS.update({
      where: { ID: productoId },
      data: { ESTADO: false },
    })
  }
}
