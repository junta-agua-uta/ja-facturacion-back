/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { CarteraClientesService } from './cartera-clientes.service';

@Injectable()
export class CarteraClientesExcelService {
    constructor(
        private readonly carteraClientesService: CarteraClientesService
    ) { }

    async generarExcelCarteraClientes(filtros: {
        empresaId: number;
        clienteId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }): Promise<Buffer> {

        const data = await this.carteraClientesService.getCartera(filtros);

        const workbook = new Workbook();

        // 🔷 HOJA PRINCIPAL: RESUMEN DE CARTERA
        const sheetResumen = workbook.addWorksheet('Resumen Cartera');

        // 🔷 HOJA SECUNDARIA: DETALLE DE CUENTAS
        const sheetDetalle = workbook.addWorksheet('Detalle Cuentas');

        // ============================================
        // 📌 HOJA 1: RESUMEN DE CARTERA
        // ============================================

        // 🔷 ENCABEZADO
        sheetResumen.mergeCells('A1:E1');
        sheetResumen.getCell('A1').value = 'CARTERA DE CLIENTES';
        sheetResumen.getCell('A1').font = { size: 14, bold: true };
        sheetResumen.getCell('A1').alignment = { horizontal: 'center' };

        // 🔷 SUBENCABEZADO CON FECHAS
        if (filtros.fechaInicio && filtros.fechaFin) {
            sheetResumen.mergeCells('A2:E2');
            sheetResumen.getCell('A2').value = `Período: ${filtros.fechaInicio.toISOString().split('T')[0]} al ${filtros.fechaFin.toISOString().split('T')[0]}`;
            sheetResumen.getCell('A2').font = { size: 10 };
            sheetResumen.getCell('A2').alignment = { horizontal: 'center' };
        }

        // 🔹 FILTRO CLIENTE ESPECÍFICO
        if (filtros.clienteId) {
            sheetResumen.mergeCells('A3:E3');
            sheetResumen.getCell('A3').value = `Cliente específico: ID ${filtros.clienteId}`;
            sheetResumen.getCell('A3').font = { size: 10, italic: true };
            sheetResumen.getCell('A3').alignment = { horizontal: 'center' };
        }

        let rowIndex = 5;

        // 🔹 CABECERA TABLA RESUMEN
        sheetResumen.getRow(rowIndex).values = [
            'ID Cliente',
            'Identificación',
            'Razón Social',
            'Total Debe',
            'Total Abonos',
            'Saldo Total',
        ];
        sheetResumen.getRow(rowIndex).font = { bold: true };
        sheetResumen.getRow(rowIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9EAD3' },
        };
        rowIndex++;

        // 🔹 CLIENTES
        let totalGeneralDebe = 0;
        let totalGeneralAbonos = 0;
        let totalGeneralSaldo = 0;

        if (data.length === 0) {
            sheetResumen.getRow(rowIndex).values = ['', '', 'No hay clientes registrados', '', '', ''];
            rowIndex++;
        } else {
            data.forEach((cliente) => {
                sheetResumen.getRow(rowIndex).values = [
                    cliente.clienteId,
                    cliente.identificacion,
                    cliente.razonSocial,
                    cliente.totalDebe.toFixed(2),
                    cliente.totalAbonos.toFixed(2),
                    cliente.saldoTotal.toFixed(2),
                ];

                // Formato de números
                sheetResumen.getCell(`D${rowIndex}`).numFmt = '#,##0.00';
                sheetResumen.getCell(`E${rowIndex}`).numFmt = '#,##0.00';
                sheetResumen.getCell(`F${rowIndex}`).numFmt = '#,##0.00';

                // Color rojo si tiene saldo pendiente
                if (cliente.saldoTotal > 0) {
                    sheetResumen.getCell(`F${rowIndex}`).font = { color: { argb: 'FFFF0000' }, bold: true };
                }

                totalGeneralDebe += cliente.totalDebe;
                totalGeneralAbonos += cliente.totalAbonos;
                totalGeneralSaldo += cliente.saldoTotal;

                rowIndex++;
            });
        }

        // 🔹 TOTALES GENERALES
        rowIndex++;
        sheetResumen.getRow(rowIndex).values = [
            '',
            '',
            'TOTALES GENERALES',
            totalGeneralDebe.toFixed(2),
            totalGeneralAbonos.toFixed(2),
            totalGeneralSaldo.toFixed(2),
        ];
        sheetResumen.getRow(rowIndex).font = { bold: true };
        sheetResumen.getRow(rowIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEAF2E3' },
        };
        sheetResumen.getCell(`D${rowIndex}`).numFmt = '#,##0.00';
        sheetResumen.getCell(`E${rowIndex}`).numFmt = '#,##0.00';
        sheetResumen.getCell(`F${rowIndex}`).numFmt = '#,##0.00';

        // ============================================
        // 📌 HOJA 2: DETALLE DE CUENTAS POR CLIENTE
        // ============================================

        let detalleRowIndex = 1;

        data.forEach((cliente) => {
            // Título del cliente
            sheetDetalle.mergeCells(`A${detalleRowIndex}:G${detalleRowIndex}`);
            sheetDetalle.getCell(`A${detalleRowIndex}`).value = `${cliente.razonSocial} (ID: ${cliente.clienteId}) - ${cliente.identificacion}`;
            sheetDetalle.getCell(`A${detalleRowIndex}`).font = { size: 12, bold: true };
            sheetDetalle.getCell(`A${detalleRowIndex}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9EAD3' },
            };
            detalleRowIndex++;

            // Resumen del cliente
            sheetDetalle.getRow(detalleRowIndex).values = [
                'Total Debe:',
                cliente.totalDebe.toFixed(2),
                'Total Abonos:',
                cliente.totalAbonos.toFixed(2),
                'Saldo Total:',
                cliente.saldoTotal.toFixed(2),
                '',
            ];
            sheetDetalle.getRow(detalleRowIndex).font = { italic: true };
            sheetDetalle.getCell(`B${detalleRowIndex}`).numFmt = '#,##0.00';
            sheetDetalle.getCell(`D${detalleRowIndex}`).numFmt = '#,##0.00';
            sheetDetalle.getCell(`F${detalleRowIndex}`).numFmt = '#,##0.00';

            if (cliente.saldoTotal > 0) {
                sheetDetalle.getCell(`F${detalleRowIndex}`).font = { color: { argb: 'FFFF0000' }, bold: true };
            }

            detalleRowIndex++;

            // Cabecera de cuentas
            sheetDetalle.getRow(detalleRowIndex).values = [
                'Cuenta ID',
                'Fecha Emisión',
                'Valor Original',
                'Abonos',
                'Saldo',
                'Estado',
                '',
            ];
            sheetDetalle.getRow(detalleRowIndex).font = { bold: true };
            detalleRowIndex++;

            // Cuentas del cliente
            if (cliente.cuentas.length === 0) {
                sheetDetalle.getRow(detalleRowIndex).values = ['', '', 'No hay cuentas registradas', '', '', '', ''];
                detalleRowIndex++;
            } else {
                cliente.cuentas.forEach((cuenta) => {
                    sheetDetalle.getRow(detalleRowIndex).values = [
                        cuenta.cuentaId,
                        cuenta.fechaEmision ? new Date(cuenta.fechaEmision).toISOString().split('T')[0] : 'N/A',
                        cuenta.valorOriginal.toFixed(2),
                        cuenta.abonos.toFixed(2),
                        cuenta.saldo.toFixed(2),
                        cuenta.estado,
                        '',
                    ];

                    sheetDetalle.getCell(`C${detalleRowIndex}`).numFmt = '#,##0.00';
                    sheetDetalle.getCell(`D${detalleRowIndex}`).numFmt = '#,##0.00';
                    sheetDetalle.getCell(`E${detalleRowIndex}`).numFmt = '#,##0.00';

                    // Color según estado
                    if (cuenta.estado === 'PENDIENTE') {
                        sheetDetalle.getCell(`F${detalleRowIndex}`).font = { color: { argb: 'FFFF0000' } };
                    } else if (cuenta.estado === 'PAGADO') {
                        sheetDetalle.getCell(`F${detalleRowIndex}`).font = { color: { argb: 'FF00AA00' } };
                    }

                    detalleRowIndex++;
                });
            }

            // Espacio entre clientes
            detalleRowIndex += 2;
        });

        // 🔷 AJUSTE AUTOMÁTICO COLUMNAS - RESUMEN
        sheetResumen.columns = [
            { width: 12 },  // ID Cliente
            { width: 18 },  // Identificación
            { width: 45 },  // Razón Social
            { width: 18 },  // Total Debe
            { width: 18 },  // Total Abonos
            { width: 18 },  // Saldo Total
        ];

        // 🔷 AJUSTE AUTOMÁTICO COLUMNAS - DETALLE
        sheetDetalle.columns = [
            { width: 12 },  // Cuenta ID
            { width: 15 },  // Fecha Emisión
            { width: 18 },  // Valor Original
            { width: 18 },  // Abonos
            { width: 18 },  // Saldo
            { width: 15 },  // Estado
            { width: 10 },  // Espacio
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}