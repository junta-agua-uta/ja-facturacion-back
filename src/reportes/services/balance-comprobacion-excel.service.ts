/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { BalanceComprobacionService } from './balance-comprobacion.service';

@Injectable()
export class BalanceComprobacionExcelService {
    constructor(
        private readonly balanceComprobacionService: BalanceComprobacionService
    ) { }

    async generarExcelBalanceComprobacion(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }): Promise<Buffer> {

        const data = await this.balanceComprobacionService.getBalance(filtros);

        const workbook = new Workbook();
        const sheet = workbook.addWorksheet('Balance de Comprobación');

        // 🔷 ENCABEZADO
        sheet.mergeCells('A1:G1');
        sheet.getCell('A1').value = 'BALANCE DE COMPROBACIÓN';
        sheet.getCell('A1').font = { size: 14, bold: true };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // 🔷 SUBENCABEZADO CON FECHAS
        if (filtros.fechaInicio && filtros.fechaFin) {
            sheet.mergeCells('A2:G2');
            sheet.getCell('A2').value = `Del ${filtros.fechaInicio.toISOString().split('T')[0]} al ${filtros.fechaFin.toISOString().split('T')[0]}`;
            sheet.getCell('A2').font = { size: 10 };
            sheet.getCell('A2').alignment = { horizontal: 'center' };
        }

        let rowIndex = 4;

        // 🔹 CABECERA TABLA
        sheet.getRow(rowIndex).values = [
            'Código',
            'Cuenta',
            'Debe',
            'Haber',
            'Saldo Deudor',
            'Saldo Acreedor',
        ];

        sheet.getRow(rowIndex).font = { bold: true };
        sheet.getRow(rowIndex).alignment = { horizontal: 'center' };
        rowIndex++;

        // 🔹 CUENTAS
        let totalDebeGeneral = 0;
        let totalHaberGeneral = 0;

        data.cuentas.forEach((cuenta) => {
            sheet.getRow(rowIndex).values = [
                cuenta.codigo,
                cuenta.nombre,
                cuenta.totalDebe,
                cuenta.totalHaber,
                cuenta.saldoDeudor,
                cuenta.saldoAcreedor,
            ];

            totalDebeGeneral += cuenta.totalDebe;
            totalHaberGeneral += cuenta.totalHaber;

            rowIndex++;
        });

        // 🔹 FILA DE TOTALES GENERALES
        rowIndex++;
        sheet.getRow(rowIndex).values = [
            '',
            '',
            'TOTALES GENERALES',
            totalDebeGeneral,
            totalHaberGeneral,
            '',
            '',
        ];

        sheet.getRow(rowIndex).font = { bold: true };
        sheet.getRow(rowIndex).getCell(2).alignment = { horizontal: 'right' };

        // 🔷 VERIFICACIÓN DE CUADRATURA
        rowIndex++;
        const cuadra = totalDebeGeneral === totalHaberGeneral;
        sheet.getRow(rowIndex).values = [
            '',
            '',
            cuadra ? '✓ CUADRADO' : '✗ NO CUADRA',
            '',
            '',
            '',
            '',
        ];

        if (cuadra) {
            sheet.getRow(rowIndex).font = { color: { argb: 'FF00AA00' }, bold: true };
        } else {
            sheet.getRow(rowIndex).font = { color: { argb: 'FFFF0000' }, bold: true };
        }

        // 🔷 AJUSTE AUTOMÁTICO COLUMNAS
        sheet.columns = [
            { width: 15 },  // Código
            { width: 45 },  // Cuenta
            { width: 12 },  // Naturaleza
            { width: 18 },  // Debe
            { width: 18 },  // Haber
            { width: 18 },  // Saldo Deudor
            { width: 18 },  // Saldo Acreedor
        ];

        // Formato de números con 2 decimales
        sheet.getRows(rowIndex - data.cuentas.length - 1, data.cuentas.length + 2).forEach(row => {
            [3, 4, 5, 6].forEach(colIdx => {
                const cell = row.getCell(colIdx + 1);
                if (typeof cell.value === 'number') {
                    cell.numFmt = '#,##0.00';
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}