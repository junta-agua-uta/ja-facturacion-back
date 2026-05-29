/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { EstadoResultadosService } from './estado-resultados.service';

@Injectable()
export class EstadoResultadosExcelService {
    constructor(
        private readonly estadoResultadosService: EstadoResultadosService
    ) { }

    async generarExcelEstadoResultados(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }): Promise<Buffer> {

        const data = await this.estadoResultadosService.getEstadoResultados(filtros);

        const workbook = new Workbook();

        // 🔷 HOJA: ESTADO DE RESULTADOS
        const sheet = workbook.addWorksheet('Estado de Resultados');

        // 🔷 ENCABEZADO
        sheet.mergeCells('A1:C1');
        sheet.getCell('A1').value = 'ESTADO DE RESULTADOS';
        sheet.getCell('A1').font = { size: 14, bold: true };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // 🔷 SUBENCABEZADO CON FECHAS
        if (filtros.fechaInicio && filtros.fechaFin) {
            sheet.mergeCells('A2:C2');
            sheet.getCell('A2').value = `Del ${filtros.fechaInicio.toISOString().split('T')[0]} al ${filtros.fechaFin.toISOString().split('T')[0]}`;
            sheet.getCell('A2').font = { size: 10 };
            sheet.getCell('A2').alignment = { horizontal: 'center' };
        }

        let rowIndex = 4;

        // ============================================
        // 📌 INGRESOS
        // ============================================
        sheet.getCell(`A${rowIndex}`).value = 'INGRESOS';
        sheet.getCell(`A${rowIndex}`).font = { size: 12, bold: true };
        sheet.getCell(`A${rowIndex}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9EAD3' },
        };
        rowIndex++;

        // Cabecera de tabla para Ingresos
        sheet.getRow(rowIndex).values = ['Código', 'Cuenta', 'Saldo'];
        sheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;

        let totalIngresos = 0;

        if (data.ingresos.length === 0) {
            sheet.getRow(rowIndex).values = ['', 'No hay ingresos registrados', ''];
            rowIndex++;
        } else {
            data.ingresos.forEach((cuenta) => {
                sheet.getRow(rowIndex).values = [
                    cuenta.codigo,
                    cuenta.nombre,
                    cuenta.saldo.toFixed(2),
                ];

                // Formato de número
                sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

                totalIngresos += cuenta.saldo;
                rowIndex++;
            });
        }

        // Total Ingresos
        rowIndex++;
        sheet.getRow(rowIndex).values = ['', 'TOTAL INGRESOS', totalIngresos.toFixed(2)];
        sheet.getRow(rowIndex).font = { bold: true };
        sheet.getRow(rowIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEAF2E3' },
        };
        sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

        rowIndex += 2;

        // ============================================
        // 📌 GASTOS
        // ============================================
        sheet.getCell(`A${rowIndex}`).value = 'GASTOS';
        sheet.getCell(`A${rowIndex}`).font = { size: 12, bold: true };
        sheet.getCell(`A${rowIndex}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFCE4D6' },
        };
        rowIndex++;

        // Cabecera de tabla para Gastos
        sheet.getRow(rowIndex).values = ['Código', 'Cuenta', 'Saldo'];
        sheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;

        let totalGastos = 0;

        if (data.gastos.length === 0) {
            sheet.getRow(rowIndex).values = ['', 'No hay gastos registrados', ''];
            rowIndex++;
        } else {
            data.gastos.forEach((cuenta) => {
                sheet.getRow(rowIndex).values = [
                    cuenta.codigo,
                    cuenta.nombre,
                    cuenta.saldo.toFixed(2),
                ];

                sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

                totalGastos += cuenta.saldo;
                rowIndex++;
            });
        }

        // Total Gastos
        rowIndex++;
        sheet.getRow(rowIndex).values = ['', 'TOTAL GASTOS', totalGastos.toFixed(2)];
        sheet.getRow(rowIndex).font = { bold: true };
        sheet.getRow(rowIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDE8E0' },
        };
        sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

        rowIndex += 3;

        // ============================================
        // 📌 UTILIDAD / PÉRDIDA NETA
        // ============================================
        const utilidad = totalIngresos - totalGastos;
        const esUtilidad = utilidad >= 0;

        sheet.getCell(`A${rowIndex}`).value = 'RESULTADO DEL PERÍODO';
        sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 11 };
        rowIndex++;

        sheet.getRow(rowIndex).values = [
            '',
            esUtilidad ? 'UTILIDAD NETA' : 'PÉRDIDA NETA',
            utilidad.toFixed(2),
        ];
        sheet.getRow(rowIndex).font = { bold: true };

        if (esUtilidad) {
            sheet.getRow(rowIndex).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9EAD3' },
            };
            sheet.getCell(`C${rowIndex}`).font = { color: { argb: 'FF00AA00' } };
        } else {
            sheet.getRow(rowIndex).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFCE4D6' },
            };
            sheet.getCell(`C${rowIndex}`).font = { color: { argb: 'FFFF0000' } };
        }

        sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

        rowIndex += 2;

        // ============================================
        // 📌 INDICADORES ADICIONALES
        // ============================================
        if (totalIngresos > 0) {
            const margenUtilidad = (utilidad / totalIngresos) * 100;

            sheet.getCell(`A${rowIndex}`).value = 'INDICADORES';
            sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 11 };
            rowIndex++;

            sheet.getRow(rowIndex).values = ['Margen de Utilidad', `${margenUtilidad.toFixed(2)}%`, ''];
            sheet.getRow(rowIndex).font = { italic: true };

            // Barra visual simple
            if (margenUtilidad > 20) {
                sheet.getCell(`B${rowIndex}`).font = { color: { argb: 'FF00AA00' } };
            } else if (margenUtilidad > 10) {
                sheet.getCell(`B${rowIndex}`).font = { color: { argb: 'FFFFAA00' } };
            } else {
                sheet.getCell(`B${rowIndex}`).font = { color: { argb: 'FFFF0000' } };
            }
        }

        // 🔷 AJUSTE AUTOMÁTICO COLUMNAS
        sheet.columns = [
            { width: 20 },  // Código
            { width: 55 },  // Cuenta
            { width: 20 },  // Saldo
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}