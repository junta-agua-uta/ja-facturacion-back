/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { LibroMayorService } from './libro-mayor.service';

@Injectable()
export class LibroMayorExcelService {
    constructor(
        private readonly libroMayorService: LibroMayorService
    ) { }

    async generarExcelLibroMayor(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }): Promise<Buffer> {

        const data = await this.libroMayorService.getLibroMayorCompleto(filtros);

        const workbook = new Workbook();
        const sheet = workbook.addWorksheet('Libro Mayor');

        // 🔷 ENCABEZADO
        sheet.mergeCells('A1:F1');
        sheet.getCell('A1').value = 'LIBRO MAYOR';
        sheet.getCell('A1').font = { size: 14, bold: true };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        let rowIndex = 3;

        // 🔁 RECORRER CUENTAS
        data.forEach((cuenta) => {

            // 🔹 Título cuenta
            sheet.getCell(`A${rowIndex}`).value = `${cuenta.codigo} - ${cuenta.nombre}`;
            sheet.getCell(`A${rowIndex}`).font = { bold: true };
            rowIndex++;

            // 🔹 Cabecera tabla
            sheet.getRow(rowIndex).values = [
                'Fecha',
                'Asiento',
                'Concepto',
                'Debe',
                'Haber',
                'Saldo',
            ];

            sheet.getRow(rowIndex).font = { bold: true };
            rowIndex++;

            let totalDebe = 0;
            let totalHaber = 0;

            // 🔹 Movimientos
            cuenta.movimientos.forEach((mov) => {
                sheet.getRow(rowIndex).values = [
                    new Date(mov.fecha).toISOString().split('T')[0],
                    mov.numero,
                    mov.concepto,
                    mov.debe,
                    mov.haber,
                    mov.saldo,
                ];

                totalDebe += mov.debe;
                totalHaber += mov.haber;

                rowIndex++;
            });

            // 🔹 Totales
            sheet.getRow(rowIndex).values = [
                '',
                '',
                'Totales',
                totalDebe,
                totalHaber,
                '',
            ];

            sheet.getRow(rowIndex).font = { bold: true };
            rowIndex += 2;
        });

        // 🔷 Ajuste automático columnas
        sheet.columns = [
            { width: 15 },
            { width: 10 },
            { width: 30 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}