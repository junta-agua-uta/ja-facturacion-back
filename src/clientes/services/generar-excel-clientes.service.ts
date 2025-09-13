import { Injectable } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { Response } from 'express'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class GenerarExcelClientesService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generarReporteClientes(response: Response, clientes: any[]) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Clientes')

    worksheet.addRow([
      'IDENTIFICACIÓN',
      'RAZÓN SOCIAL',
      'NOMBRE COMERCIAL',
      'DIRECCIÓN',
      'TELÉFONO 1',
      'TELÉFONO 2',
      'CORREO',
      'PROVINCIA',
      'CIUDAD',
      'PARROQUIA',
      'FECHA DE CREACIÓN',
    ])

    clientes.forEach((c) => {
      worksheet.addRow([
        c.IDENTIFICACION,
        c.RAZON_SOCIAL,
        c.NOMBRE_COMERCIAL || 'N/A',
        c.DIRECCION,
        c.TELEFONO1,
        c.TELEFONO2 || 'N/A',
        c.CORREO || 'N/A',
        c.PROVINCIA || 'N/A',
        c.CIUDAD || 'N/A',
        c.PARROQUIA || 'N/A',
        DateUtil.formatDate(c.FECHA_CREACION as string),
      ])
    })

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=clientes.xlsx',
    )

    await workbook.xlsx.write(response)
    response.end()
  }
}
