import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { BuscarFacturasPorFechaDto } from '../dtos/buscarFacturaFecha.dto'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class ObtenerFacturaPorFechaService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerFacturasPorFecha(params: BuscarFacturasPorFechaDto) {
    const { fechaInicio, fechaFin, page = 1, limit = 10 } = params

    const pageNum = Number(page) < 1 ? 1 : Number(page)
    const limitNum = Number(limit) < 1 ? 10 : Number(limit)
    const offset = (pageNum - 1) * limitNum

    // Preparar el filtro de fechas
    let dateFilter: any = {}

    if (fechaInicio && fechaFin) {
      // Rango de fechas
      const startDate = new Date(fechaInicio)
      // Configurar la fecha de fin para incluir todo el día
      const endDate = DateUtil.getLocalDate(
        new Date(fechaFin + 'T23:59:59.999'),
      )

      Logger.log(endDate)
      dateFilter = {
        FECHA_EMISION: {
          gte: startDate,
          lte: endDate,
        },
      }
    } else if (fechaInicio) {
      const startDate = new Date(fechaInicio)
      const endDate = DateUtil.getLocalDate(
        new Date(fechaInicio + 'T23:59:59.999'),
      )

      dateFilter = {
        FECHA_EMISION: {
          gte: startDate,
          lte: endDate,
        },
      }
    }

    // Consultar las facturas con paginación y filtro de fechas
    const [facturas, totalItems] = await Promise.all([
      this.prisma.fACTURAS.findMany({
        where: {
          ...dateFilter,
          NOT: {
            ID_USUARIO: 6,
          },
        },
        skip: offset,
        take: limitNum,
        orderBy: {
          FECHA_EMISION: 'desc',
        },
        include: {
          cliente: true,
          usuario: true,
          sucursal: true,
          DETALLES_FACTURA: {
            include: {
              razon: true,
            },
          },
        },
      }),
      this.prisma.fACTURAS.count({
        where: {
          ...dateFilter,
          NOT: {
            ID_USUARIO: 6,
          },
        },
      }),
    ])

    const totalPages = Math.ceil(totalItems / limitNum)

    return {
      data: facturas,
      totalItems,
      totalPages,
      currentPage: pageNum,
    }
  }

  async obtenerFacturasPorFechaSinPaginacion(
    params: BuscarFacturasPorFechaDto,
  ) {
    const { fechaInicio, fechaFin } = params
    let dateFilter: any = {}
    if (fechaInicio && fechaFin) {
      // Rango de fechas
      const startDate = new Date(fechaInicio)
      // Configurar la fecha de fin para incluir todo el día
      const endDate = DateUtil.getLocalDate(
        new Date(fechaFin + 'T23:59:59.999'),
      )

      dateFilter = {
        FECHA_EMISION: {
          gte: startDate,
          lte: endDate,
        },
      }
    } else if (fechaInicio) {
      const startDate = new Date(fechaInicio)
      const endDate = DateUtil.getLocalDate(
        new Date(fechaInicio + 'T23:59:59.999'),
      )

      dateFilter = {
        FECHA_EMISION: {
          gte: startDate,
          lte: endDate,
        },
      }
    }
    return this.prisma.fACTURAS.findMany({
      where: {
        ...dateFilter,
        NOT: {
          ID_USUARIO: 6,
        },
      },
      include: {
        cliente: true,
        usuario: true,
        sucursal: true,
        DETALLES_FACTURA: {
          include: {
            razon: true,
          },
        },
      },
    })
  }
}
