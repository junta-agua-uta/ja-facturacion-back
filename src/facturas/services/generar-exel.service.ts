import { Injectable } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { Response } from 'express'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class GenerarExelService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generarReporteFacturas(response: Response, facturas: any[]) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Facturas')

    // Cabeceras
    worksheet.addRow([
      'COMPROBANTE',
      'SERIE COMPROBANTE',
      'FECHA AUTORIZACION',
      'FECHA EMISIÓN',
      'VALOR SIN IMPUESTOS',
      'IVA',
      'IMPORTE TOTAL',
    ])

    // Contenido
    facturas.forEach((f) => {
      const guiaRemision = `${f.ID_SUCURSAL.toString().padStart(3, '0')}-${f.sucursal.PUNTO_EMISION}-${f.SECUENCIA.toString().padStart(9, '0')}`
      worksheet.addRow([
        'Factura',
        guiaRemision,
        DateUtil.formatDate(f.FECHA_AUTORIZACION as string),
        DateUtil.formatDate(f.FECHA_EMISION as string),
        f.VALOR_SIN_IMPUESTO,
        f.IVA,
        f.TOTAL,
      ])
    })

    // Establecer cabecera para descarga
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=facturas.xlsx',
    )

    // Escribir y enviar archivo
    await workbook.xlsx.write(response)
    response.end()
  }
}
