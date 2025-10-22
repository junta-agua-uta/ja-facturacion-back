import { Injectable } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { Response } from 'express'

@Injectable()
export class GenerarExcelLiquidacionesService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generarReporteLiquidaciones(response: Response, liquidaciones: any[]) {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Liquidaciones de Compra')

      worksheet.addRow([
        'ID',
        'FECHA EMISIÓN',
        'RAZÓN SOCIAL PROVEEDOR',
        'IDENTIFICACIÓN PROVEEDOR',
        'DIRECCIÓN ESTABLECIMIENTO',
        'TIPO IDENTIFICACIÓN',
        'TOTAL SIN IMPUESTOS',
        'TOTAL DESCUENTO',
        'IMPORTE TOTAL',
        'MONEDA',
        'ESTADO SRI',
        'CLAVE DE ACCESO',
        'FECHA CREACIÓN',
      ])

      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' },
      }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

      liquidaciones.forEach((liquidacion) => {
        worksheet.addRow([
          liquidacion.id,
          liquidacion.fechaEmision,
          liquidacion.razonSocialProveedor,
          liquidacion.identificacionProveedor,
          liquidacion.dirEstablecimiento,
          liquidacion.tipoIdentificacionProveedor,
          liquidacion.totalSinImpuestos,
          liquidacion.totalDescuento,
          liquidacion.importeTotal,
          liquidacion.moneda,
          liquidacion.estadoSri,
          liquidacion.accessKey,
          liquidacion.createdAt
            ? new Date(liquidacion.createdAt).toLocaleDateString()
            : 'N/A',
        ])
      })

      worksheet.columns.forEach((column) => {
        column.width = 15
      })

      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=liquidaciones-compra.xlsx',
      )

      await workbook.xlsx.write(response)
      response.end()
    } catch (error) {
      throw new Error(`Error generando Excel: ${error.message}`)
    }
  }
}
