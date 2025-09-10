import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { CrearSucursalDto } from '../dtos/crearSucursal.dto'
import { EditarSucursalDto } from '../dtos/editarSucursal.dto'

@Injectable()
export class CrudSucursalesService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerSucursalPorId(id: number) {
    if (!id) {
      throw new Error('El ID de la sucursal es requerido.')
    }

    const sucursal = await this.prisma.sUCURSALES.findUnique({
      where: { ID: id },
    })

    if (!sucursal) {
      throw new Error('Sucursal no encontrada.')
    }

    return sucursal
  }

  async crearSucursal(sucursalData: CrearSucursalDto) {
    // Validar que no exista una sucursal con el mismo nombre o punto de emisión
    const sucursalExistente = await this.prisma.sUCURSALES.findFirst({
      where: {
        OR: [
          { NOMBRE: sucursalData.nombre },
          { PUNTO_EMISION: sucursalData.punto_emision },
        ],
      },
    })

    if (sucursalExistente) {
      throw new Error(
        'Ya existe una sucursal con el mismo nombre o punto de emisión.',
      )
    }

    // Crear la sucursal
    const sucursalCreada = await this.prisma.sUCURSALES.create({
      data: {
        NOMBRE: sucursalData.nombre,
        UBICACION: sucursalData.ubicacion,
        PUNTO_EMISION: sucursalData.punto_emision,
      },
    })
    return sucursalCreada
  }

  async editarSucursal(id: number, sucursalData: EditarSucursalDto) {
    if (!id) {
      throw new Error('El ID de la sucursal es requerido.')
    }

    // Verificar si existe una sucursal con el mismo nombre o punto de emisión
    if (sucursalData.nombre || sucursalData.punto_emision) {
      const sucursalExistente = await this.prisma.sUCURSALES.findFirst({
        where: {
          AND: [
            { ID: { not: id } },
            {
              OR: [
                { NOMBRE: sucursalData.nombre },
                { PUNTO_EMISION: sucursalData.punto_emision },
              ],
            },
          ],
        },
      })

      if (sucursalExistente) {
        throw new Error(
          'Ya existe una sucursal con el mismo nombre o punto de emisión.',
        )
      }
    }

    // Actualizar la sucursal
    const sucursalActualizada = await this.prisma.sUCURSALES.update({
      where: { ID: id },
      data: {
        NOMBRE: sucursalData.nombre,
        UBICACION: sucursalData.ubicacion,
        PUNTO_EMISION: sucursalData.punto_emision,
      },
    })
    return sucursalActualizada
  }
}
