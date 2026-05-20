/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { BalanceGeneralService } from './balance-general.service';

@Injectable()
export class BalanceGeneralExcelService {
    constructor(
        private readonly balanceGeneralService: BalanceGeneralService
    ) { }

    async generarExcelBalanceGeneral(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }): Promise<Buffer> {

        const data = await this.balanceGeneralService.getBalanceGeneral(filtros);

        const workbook = new Workbook();

        // 🔷 HOJA: BALANCE GENERAL
        const sheet = workbook.addWorksheet('Balance General');

        // 🔷 ENCABEZADO
        sheet.mergeCells('A1:D1');
        sheet.getCell('A1').value = 'BALANCE GENERAL';
        sheet.getCell('A1').font = { size: 14, bold: true };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // 🔷 SUBENCABEZADO CON FECHAS
        if (filtros.fechaInicio && filtros.fechaFin) {
            sheet.mergeCells('A2:D2');
            sheet.getCell('A2').value = `Del ${filtros.fechaInicio.toISOString().split('T')[0]} al ${filtros.fechaFin.toISOString().split('T')[0]}`;
            sheet.getCell('A2').font = { size: 10 };
            sheet.getCell('A2').alignment = { horizontal: 'center' };
        }

        let rowIndex = 4;

        // ============================================
        // 📌 ACTIVOS
        // ============================================
        sheet.getCell(`A${rowIndex}`).value = 'ACTIVOS';
        sheet.getCell(`A${rowIndex}`).font = { size: 12, bold: true };
        sheet.getCell(`A${rowIndex}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9EAD3' },
        };
        rowIndex++;

        // Cabecera de tabla para Activos
        sheet.getRow(rowIndex).values = ['Código', 'Cuenta', 'Saldo', ''];
        sheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;

        let totalActivos = 0;

        data.activos.forEach((cuenta) => {
            sheet.getRow(rowIndex).values = [
                cuenta.codigo,
                cuenta.nombre,
                cuenta.saldo.toFixed(2),
                '',
            ];

            // Formato de número
            sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

            totalActivos += cuenta.saldo;
            rowIndex++;
        });

        // Total Activos
        rowIndex++;
        sheet.getRow(rowIndex).values = ['', 'TOTAL ACTIVOS', totalActivos.toFixed(2), ''];
        sheet.getRow(rowIndex).font = { bold: true };
        sheet.getRow(rowIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEAF2E3' },
        };
        sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

        rowIndex += 2;

        // ============================================
        // 📌 PASIVOS
        // ============================================
        sheet.getCell(`A${rowIndex}`).value = 'PASIVOS';
        sheet.getCell(`A${rowIndex}`).font = { size: 12, bold: true };
        sheet.getCell(`A${rowIndex}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFCE4D6' },
        };
        rowIndex++;

        // Cabecera de tabla para Pasivos
        sheet.getRow(rowIndex).values = ['Código', 'Cuenta', 'Saldo', ''];
        sheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;

        let totalPasivos = 0;

        data.pasivos.forEach((cuenta) => {
            sheet.getRow(rowIndex).values = [
                cuenta.codigo,
                cuenta.nombre,
                cuenta.saldo.toFixed(2),
                '',
            ];

            sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

            totalPasivos += cuenta.saldo;
            rowIndex++;
        });

        // Total Pasivos
        rowIndex++;
        sheet.getRow(rowIndex).values = ['', 'TOTAL PASIVOS', totalPasivos.toFixed(2), ''];
        sheet.getRow(rowIndex).font = { bold: true };
        sheet.getRow(rowIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDE8E0' },
        };
        sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

        rowIndex += 2;

        // ============================================
        // 📌 PATRIMONIO
        // ============================================
        sheet.getCell(`A${rowIndex}`).value = 'PATRIMONIO';
        sheet.getCell(`A${rowIndex}`).font = { size: 12, bold: true };
        sheet.getCell(`A${rowIndex}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDEBF7' },
        };
        rowIndex++;

        // Cabecera de tabla para Patrimonio
        sheet.getRow(rowIndex).values = ['Código', 'Cuenta', 'Saldo', ''];
        sheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;

        let totalPatrimonio = 0;

        data.patrimonio.forEach((cuenta) => {
            sheet.getRow(rowIndex).values = [
                cuenta.codigo,
                cuenta.nombre,
                cuenta.saldo.toFixed(2),
                '',
            ];

            sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

            totalPatrimonio += cuenta.saldo;
            rowIndex++;
        });

        // Total Patrimonio
        rowIndex++;
        sheet.getRow(rowIndex).values = ['', 'TOTAL PATRIMONIO', totalPatrimonio.toFixed(2), ''];
        sheet.getRow(rowIndex).font = { bold: true };
        sheet.getRow(rowIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F0FA' },
        };
        sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

        rowIndex += 3;

        // ============================================
        // 📌 ECUACIÓN CONTABLE
        // ============================================
        sheet.getCell(`A${rowIndex}`).value = 'VERIFICACIÓN DE ECUACIÓN CONTABLE';
        sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 11 };
        rowIndex++;

        sheet.getRow(rowIndex).values = ['ACTIVOS =', 'PASIVOS + PATRIMONIO', 'DIFERENCIA', ''];
        sheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;

        const pasivoMasPatrimonio = totalPasivos + totalPatrimonio;
        const diferencia = totalActivos - pasivoMasPatrimonio;
        const cuadra = diferencia === 0;

        sheet.getRow(rowIndex).values = [
            totalActivos.toFixed(2),
            pasivoMasPatrimonio.toFixed(2),
            diferencia.toFixed(2),
            cuadra ? '✓ CUADRA' : '✗ NO CUADRA',
        ];

        if (cuadra) {
            sheet.getCell(`D${rowIndex}`).font = { color: { argb: 'FF00AA00' }, bold: true };
        } else {
            sheet.getCell(`D${rowIndex}`).font = { color: { argb: 'FFFF0000' }, bold: true };
        }

        sheet.getCell(`A${rowIndex}`).numFmt = '#,##0.00';
        sheet.getCell(`B${rowIndex}`).numFmt = '#,##0.00';
        sheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';

        // 🔷 AJUSTE AUTOMÁTICO COLUMNAS
        sheet.columns = [
            { width: 20 },  // Código
            { width: 55 },  // Cuenta
            { width: 20 },  // Saldo
            { width: 20 },  // Verificación
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}