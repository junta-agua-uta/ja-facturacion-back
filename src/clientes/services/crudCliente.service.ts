import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { CrearClienteDto } from '../dtos/crearCliente.dto'
import { EditarClienteDto } from '../dtos/editarCliente.dto'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class CrudClienteService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerClientes(page: number = 1, limit: number = 10) {
    if (page < 1) page = 1
    if (limit < 1) limit = 10
    const offset = (page - 1) * limit

    const [clientes, totalItems] = await Promise.all([
      this.prisma.cLIENTES.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          FECHA_CREACION: 'desc',
        },
      }),
      this.prisma.cLIENTES.count(),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data: clientes,
      totalItems,
      totalPages,
      currentPage: page,
    }
  }

  async crearCliente(clienteData: CrearClienteDto) {
    // Verificar si ya existe un cliente con la misma identificación o correo
    const clienteExistente = await this.prisma.cLIENTES.findFirst({
      where: {
        IDENTIFICACION: clienteData.identificacion,
      },
    })

    if (clienteExistente) {
      throw new Error(
        'Ya existe un cliente con la misma identificación o correo.',
      )
    }
    if (!clienteData.correo || clienteData.correo === '') {
      clienteData.correo = 'tiolucasoswaldo1967@gmail.com'
    }
    // Crear el cliente
    const clienteCreado = await this.prisma.cLIENTES.create({
      data: {
        RAZON_SOCIAL: clienteData.razonSocial,
        IDENTIFICACION: clienteData.identificacion,
        CORREO: clienteData.correo,
        TELEFONO1: clienteData.telefono1,
        DIRECCION: clienteData.direccion,
        TELEFONO2: clienteData.telefono2,
        CIUDAD: clienteData.ciudad,
        PROVINCIA: clienteData.provincia,
        PARROQUIA: clienteData.parroquia,
        TARIFA: clienteData.tarifa,
        GRUPO: clienteData.grupo,
        ZONA: clienteData.zona,
        RUTA: clienteData.ruta,
        VENDEDOR: clienteData.vendedor,
        COBRADOR: clienteData.cobrador,
        NOMBRE_COMERCIAL: clienteData.nombreComercial,
        FECHA_CREACION: DateUtil.getCurrentDate(),
      },
    })
    return clienteCreado
  }

  async editarCliente(id: number, clienteData: EditarClienteDto) {
    if (!id) {
      throw new Error('El ID del cliente es requerido.')
    }

    if (clienteData.identificacion || clienteData.correo) {
      const clienteExistente = await this.prisma.cLIENTES.findFirst({
        where: {
          ID: { not: id },
          IDENTIFICACION: clienteData.identificacion,
        },
      })

      if (clienteExistente) {
        throw new Error(
          'Ya existe un cliente con la misma identificación o correo.',
        )
      }
    }

    // Actualizar el cliente
    const clienteActualizado = await this.prisma.cLIENTES.update({
      where: { ID: id },
      data: {
        IDENTIFICACION: clienteData.identificacion,
        RAZON_SOCIAL: clienteData.razonSocial,
        NOMBRE_COMERCIAL: clienteData.nombreComercial,
        DIRECCION: clienteData.direccion,
        TELEFONO1: clienteData.telefono1,
        TELEFONO2: clienteData.telefono2,
        CORREO: clienteData.correo,
        TARIFA: clienteData.tarifa,
        GRUPO: clienteData.grupo,
        ZONA: clienteData.zona,
        RUTA: clienteData.ruta,
        VENDEDOR: clienteData.vendedor,
        COBRADOR: clienteData.cobrador,
        PROVINCIA: clienteData.provincia,
        CIUDAD: clienteData.ciudad,
        PARROQUIA: clienteData.parroquia,
      },
    })
    return clienteActualizado
  }
}
