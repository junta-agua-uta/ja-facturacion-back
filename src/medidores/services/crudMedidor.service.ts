// filepath: c:\Users\edder\OneDrive\Escritorio\Junta Medidores\JuntaAgua\src\medidores\services\crudMedidor.service.ts
import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { CrearMedidorDto } from '../dtos/crearMedidor.dto'
import { EditarMedidorDto } from '../dtos/editarMedidor.dto'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class CrudMedidorService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerMedidores(
    page: number = 1,
    limit: number = 10,
    idCliente?: number,
    numeroMedidor?: string,
  ) {
    if (page < 1) page = 1
    if (limit < 1) limit = 10
    const offset = (page - 1) * limit

    // Construir el filtro de búsqueda
    const where = {} as {
      ID_CLIENTE?: number
      NUMERO_MEDIDOR?: { contains: string }
    }

    if (idCliente) {
      where.ID_CLIENTE = idCliente
    }

    if (numeroMedidor) {
      where.NUMERO_MEDIDOR = {
        contains: numeroMedidor,
      }
    }

    const [medidores, totalItems] = await Promise.all([
      this.prisma.mEDIDORES.findMany({
        skip: offset,
        take: limit,
        where,
        orderBy: {
          FECHA_CREACION: 'desc',
        },
        include: {
          cliente: true, // Incluye los datos del cliente relacionado
        },
      }),
      this.prisma.mEDIDORES.count({ where }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data: medidores,
      totalItems,
      totalPages,
      currentPage: page,
    }
  }
  async crearMedidor(medidorData: CrearMedidorDto) {
    // Validación de campos requeridos
    if (!medidorData.numeroMedidor || medidorData.numeroMedidor.trim() === '') {
      throw new Error('El número de medidor es obligatorio.')
    }

    if (!medidorData.idCliente) {
      throw new Error('El ID del cliente es obligatorio.')
    }

    // Verificar si ya existe un medidor con el mismo número
    const medidorExistente = await this.prisma.mEDIDORES.findUnique({
      where: {
        NUMERO_MEDIDOR: medidorData.numeroMedidor,
      },
    })

    if (medidorExistente) {
      throw new Error(
        `Ya existe un medidor con el número ${medidorData.numeroMedidor}. Por favor, utilice otro número.`,
      )
    }

    // Verificar si el cliente existe
    const clienteExistente = await this.prisma.cLIENTES.findUnique({
      where: {
        ID: medidorData.idCliente,
      },
    })

    if (!clienteExistente) {
      throw new Error(
        `El cliente con ID ${medidorData.idCliente} no existe. Por favor, seleccione un cliente válido.`,
      )
    }

    // Crear el medidor
    const medidorCreado = await this.prisma.mEDIDORES.create({
      data: {
        NUMERO_MEDIDOR: medidorData.numeroMedidor,
        MODELO: medidorData.modelo,
        MARCA: medidorData.marca,
        UBICACION: medidorData.ubicacion,
        ID_CLIENTE: medidorData.idCliente,
        FECHA_CREACION: DateUtil.getCurrentDate(),
      },
    })
    return medidorCreado
  }
  async editarMedidor(id: number | string, medidorData: EditarMedidorDto) {
    if (!id) {
      throw new Error(
        'El ID del medidor es requerido para realizar la edición.',
      )
    }

    // Convertir el ID a número entero si es string
    const medidorId = typeof id === 'string' ? parseInt(id, 10) : id

    // Verificar si el medidor existe
    const medidorExistente = await this.prisma.mEDIDORES.findUnique({
      where: {
        ID: medidorId,
      },
    })

    if (!medidorExistente) {
      throw new Error(
        `El medidor con ID ${medidorId} no existe. No es posible editarlo.`,
      )
    }

    // Verificar si se está intentando cambiar el número del medidor a uno que ya existe
    if (
      medidorData.numeroMedidor &&
      medidorData.numeroMedidor !== medidorExistente.NUMERO_MEDIDOR
    ) {
      const medidorConMismoNumero = await this.prisma.mEDIDORES.findUnique({
        where: {
          NUMERO_MEDIDOR: medidorData.numeroMedidor,
        },
      })

      if (medidorConMismoNumero) {
        throw new Error(
          `Ya existe un medidor con el número ${medidorData.numeroMedidor}. Por favor, utilice otro número.`,
        )
      }
    } // Si se especifica un nuevo ID de cliente, verificar que exista
    if (medidorData.idCliente) {
      const clienteExistente = await this.prisma.cLIENTES.findUnique({
        where: {
          ID: medidorData.idCliente,
        },
      })

      if (!clienteExistente) {
        throw new Error(
          `El cliente con ID ${medidorData.idCliente} no existe. Por favor, seleccione un cliente válido.`,
        )
      }
    }

    // Actualizar el medidor
    const medidorActualizado = await this.prisma.mEDIDORES.update({
      where: { ID: medidorId },
      data: {
        NUMERO_MEDIDOR: medidorData.numeroMedidor,
        MODELO: medidorData.modelo,
        MARCA: medidorData.marca,
        UBICACION: medidorData.ubicacion,
        ID_CLIENTE: medidorData.idCliente,
      },
    })
    return medidorActualizado
  }
  async eliminarMedidor(id: number | string) {
    if (!id) {
      throw new Error('El ID del medidor es requerido para poder eliminarlo.')
    }

    // Convertir el ID a número entero si es string
    const medidorId = typeof id === 'string' ? parseInt(id, 10) : id

    // Verificar si el medidor existe
    const medidorExistente = await this.prisma.mEDIDORES.findUnique({
      where: {
        ID: medidorId,
      },
    })

    if (!medidorExistente) {
      throw new Error(
        `El medidor con ID ${medidorId} no existe. No es posible eliminarlo.`,
      )
    }

    // Comprobar si el medidor tiene facturas asociadas antes de eliminar
    const facturasAsociadas = await this.prisma.fACTURAS.count({
      where: {
        ID_MEDIDOR: medidorId,
      },
    })

    if (facturasAsociadas > 0) {
      throw new Error(
        `No se puede eliminar el medidor porque tiene ${facturasAsociadas} facturas asociadas.`,
      )
    }

    // Eliminar el medidor
    await this.prisma.mEDIDORES.delete({
      where: { ID: medidorId },
    })

    return {
      message: `Medidor ${medidorExistente.NUMERO_MEDIDOR} eliminado correctamente.`,
    }
  }
}
