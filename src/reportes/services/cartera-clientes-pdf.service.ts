/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

@Injectable()
export class CarteraClientesPdfService {
    constructor(
        private readonly prisma: PrismaClient
    ) { }

    async generarPdfCarteraClientes(
        empresaId: number,
        data: any[],
        filtros: { clienteId?: number; fechaInicio?: Date; fechaFin?: Date }
    ): Promise<Buffer> {
        const empresa = await this.prisma.empresa.findUnique({
            where: { id: empresaId },
        });

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 40 });
                const buffers: Buffer[] = [];

                doc.on('data', (chunk) => buffers.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // 🧾 ENCABEZADO
                doc.fontSize(16).text(empresa?.nombre || 'Empresa', { align: 'center' });
                doc.fontSize(10).text(`RUC: ${empresa?.ruc || '9999999999001'}`, { align: 'center' });
                doc.moveDown(0.5);

                doc.fontSize(14).text('CARTERA DE CLIENTES', { align: 'center' });

                if (filtros.fechaInicio && filtros.fechaFin) {
                    doc
                        .fontSize(10)
                        .text(
                            `Período: ${filtros.fechaInicio.toISOString().split('T')[0]} al ${filtros.fechaFin.toISOString().split('T')[0]}`,
                            { align: 'center' }
                        );
                }

                if (filtros.clienteId) {
                    doc.fontSize(10).text(`Cliente específico: ID ${filtros.clienteId}`, { align: 'center', italic: true });
                }

                doc.moveDown(1.5);

                // ============================================
                // 📌 TABLA DE RESUMEN DE CARTERA
                // ============================================
                const startX = 40;
                const colWidths = {
                    id: 50,
                    identificacion: 80,
                    razonSocial: 180,
                    totalDebe: 70,
                    totalAbonos: 70,
                    saldoTotal: 70,
                };

                // Cabecera
                doc.font('Helvetica-Bold').fontSize(9);
                const headerY = doc.y; // usar coordenada Y fija para alinear columnas
                doc.text('ID', startX, headerY, { width: colWidths.id });
                doc.text('Identificación', startX + colWidths.id, headerY, { width: colWidths.identificacion });
                doc.text('Razón Social', startX + colWidths.id + colWidths.identificacion, headerY, { width: colWidths.razonSocial });
                doc.text('Total Debe', startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial, headerY, { width: colWidths.totalDebe, align: 'right' });
                doc.text('Total Abonos', startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe, headerY, { width: colWidths.totalAbonos, align: 'right' });
                doc.text('Saldo Total', startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe + colWidths.totalAbonos, headerY, { width: colWidths.saldoTotal, align: 'right' });

                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe + colWidths.totalAbonos + colWidths.saldoTotal, doc.y).stroke();
                doc.moveDown(0.5);

                let totalGeneralDebe = 0;
                let totalGeneralAbonos = 0;
                let totalGeneralSaldo = 0;

                if (data.length === 0) {
                    doc.font('Helvetica');
                    doc.text('No hay clientes registrados en el período', startX + 20, doc.y);
                    doc.moveDown(0.5);
                } else {
                    data.forEach((cliente) => {
                        if (doc.y > 650) {
                            doc.addPage();
                            // Re-dibujar cabecera
                            doc.font('Helvetica-Bold').fontSize(9);
                            const headerY2 = doc.y;
                            doc.text('ID', startX, headerY2, { width: colWidths.id });
                            doc.text('Identificación', startX + colWidths.id, headerY2, { width: colWidths.identificacion });
                            doc.text('Razón Social', startX + colWidths.id + colWidths.identificacion, headerY2, { width: colWidths.razonSocial });
                            doc.text('Total Debe', startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial, headerY2, { width: colWidths.totalDebe, align: 'right' });
                            doc.text('Total Abonos', startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe, headerY2, { width: colWidths.totalAbonos, align: 'right' });
                            doc.text('Saldo Total', startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe + colWidths.totalAbonos, headerY2, { width: colWidths.saldoTotal, align: 'right' });
                            doc.moveDown(0.3);
                            doc.moveTo(startX, doc.y).lineTo(startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe + colWidths.totalAbonos + colWidths.saldoTotal, doc.y).stroke();
                            doc.moveDown(0.5);
                        }

                        const yRow = doc.y;
                        doc.font('Helvetica');
                        doc.text(cliente.clienteId.toString(), startX, yRow, { width: colWidths.id });
                        doc.text(cliente.identificacion, startX + colWidths.id, yRow, { width: colWidths.identificacion });
                        doc.text(cliente.razonSocial.length > 30 ? cliente.razonSocial.substring(0, 27) + '...' : cliente.razonSocial, startX + colWidths.id + colWidths.identificacion, yRow, { width: colWidths.razonSocial });
                        doc.text(cliente.totalDebe.toFixed(2), startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial, yRow, { width: colWidths.totalDebe, align: 'right' });
                        doc.text(cliente.totalAbonos.toFixed(2), startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe, yRow, { width: colWidths.totalAbonos, align: 'right' });

                        // Saldo con color
                        if (cliente.saldoTotal > 0) {
                            doc.fillColor('red');
                        }
                        doc.text(cliente.saldoTotal.toFixed(2), startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe + colWidths.totalAbonos, yRow, { width: colWidths.saldoTotal, align: 'right' });
                        doc.fillColor('black');

                        totalGeneralDebe += cliente.totalDebe;
                        totalGeneralAbonos += cliente.totalAbonos;
                        totalGeneralSaldo += cliente.saldoTotal;

                        doc.moveDown(0.4);
                    });
                }

                // Totales generales
                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe + colWidths.totalAbonos + colWidths.saldoTotal, doc.y).stroke();
                doc.moveDown(0.3);

                doc.font('Helvetica-Bold');
                // Calcular anchos y posiciones para alinear la etiqueta y los montos con las columnas
                const tableWidth = colWidths.id + colWidths.identificacion + colWidths.razonSocial + colWidths.totalDebe + colWidths.totalAbonos + colWidths.saldoTotal;
                const labelX = startX;
                const labelWidth = colWidths.id + colWidths.identificacion + colWidths.razonSocial;

                // Usar una única coordenada Y para que todos los elementos queden perfectamente alineados
                doc.fontSize(9);
                const yTotals = doc.y + 2; // pequeño ajuste visual hacia abajo
                doc.fillColor('black');
                doc.text('TOTALES GENERALES', labelX, yTotals, { width: labelWidth, align: 'center' });

                // Montos alineados a la derecha en sus columnas respectivas usando la misma Y
                const debeX = startX + colWidths.id + colWidths.identificacion + colWidths.razonSocial;
                const abonosX = debeX + colWidths.totalDebe;
                const saldoX = abonosX + colWidths.totalAbonos;

                doc.text(totalGeneralDebe.toFixed(2), debeX, yTotals, { width: colWidths.totalDebe, align: 'right' });
                doc.text(totalGeneralAbonos.toFixed(2), abonosX, yTotals, { width: colWidths.totalAbonos, align: 'right' });
                doc.text(totalGeneralSaldo.toFixed(2), saldoX, yTotals, { width: colWidths.saldoTotal, align: 'right' });

                doc.moveDown(1.5);

                // ============================================
                // 📌 DETALLE DE CUENTAS POR CLIENTE
                // ============================================
                doc.addPage();

                data.forEach((cliente) => {
                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    // Título del cliente
                    doc.font('Helvetica-Bold').fontSize(11);
                    doc.fillColor('darkblue');
                    doc.text(`${cliente.razonSocial} (ID: ${cliente.clienteId}) - ${cliente.identificacion}`, startX, doc.y);
                    doc.fillColor('black');
                    doc.moveDown(0.3);

                    // Resumen del cliente
                    doc.fontSize(9);
                    doc.font('Helvetica');
                    doc.text(`Total Debe: ${cliente.totalDebe.toFixed(2)}`, startX + 20, doc.y);
                    doc.text(`Total Abonos: ${cliente.totalAbonos.toFixed(2)}`, startX + 180, doc.y);

                    if (cliente.saldoTotal > 0) {
                        doc.fillColor('red');
                    }
                    doc.text(`Saldo Total: ${cliente.saldoTotal.toFixed(2)}`, startX + 340, doc.y);
                    doc.fillColor('black');
                    doc.moveDown(0.8);

                    // Cabecera de cuentas
                    doc.font('Helvetica-Bold').fontSize(8);
                    const accHeaderY = doc.y;
                    doc.text('Cuenta ID', startX, accHeaderY, { width: 60 });
                    doc.text('Fecha Emisión', startX + 60, accHeaderY, { width: 70 });
                    doc.text('Valor Original', startX + 130, accHeaderY, { width: 70, align: 'right' });
                    doc.text('Abonos', startX + 200, accHeaderY, { width: 70, align: 'right' });
                    doc.text('Saldo', startX + 270, accHeaderY, { width: 70, align: 'right' });
                    doc.text('Estado', startX + 340, accHeaderY, { width: 70 });

                    doc.moveDown(0.2);
                    doc.moveTo(startX, doc.y).lineTo(startX + 410, doc.y).stroke();
                    doc.moveDown(0.3);

                    if (cliente.cuentas.length === 0) {
                        doc.font('Helvetica');
                        doc.text('No hay cuentas registradas', startX + 20, doc.y);
                        doc.moveDown(0.5);
                    } else {
                        cliente.cuentas.forEach((cuenta) => {
                            if (doc.y > 750) {
                                doc.addPage();
                                // Re-dibujar cabecera
                                doc.font('Helvetica-Bold').fontSize(8);
                                const accHeaderY2 = doc.y;
                                doc.text('Cuenta ID', startX, accHeaderY2, { width: 60 });
                                doc.text('Fecha Emisión', startX + 60, accHeaderY2, { width: 70 });
                                doc.text('Valor Original', startX + 130, accHeaderY2, { width: 70, align: 'right' });
                                doc.text('Abonos', startX + 200, accHeaderY2, { width: 70, align: 'right' });
                                doc.text('Saldo', startX + 270, accHeaderY2, { width: 70, align: 'right' });
                                doc.text('Estado', startX + 340, accHeaderY2, { width: 70 });
                                doc.moveDown(0.2);
                                doc.moveTo(startX, doc.y).lineTo(startX + 410, doc.y).stroke();
                                doc.moveDown(0.3);
                            }

                            const yRow = doc.y;
                            doc.font('Helvetica');
                            doc.fontSize(8);
                            doc.text(cuenta.cuentaId.toString(), startX, yRow, { width: 60 });
                            doc.text(cuenta.fechaEmision ? new Date(cuenta.fechaEmision).toISOString().split('T')[0] : 'N/A', startX + 60, yRow, { width: 70 });
                            doc.text(cuenta.valorOriginal.toFixed(2), startX + 130, yRow, { width: 70, align: 'right' });
                            doc.text(cuenta.abonos.toFixed(2), startX + 200, yRow, { width: 70, align: 'right' });

                            if (cuenta.saldo > 0) {
                                doc.fillColor('red');
                            }
                            doc.text(cuenta.saldo.toFixed(2), startX + 270, yRow, { width: 70, align: 'right' });
                            doc.fillColor('black');

                            if (cuenta.estado === 'PENDIENTE') {
                                doc.fillColor('red');
                            } else if (cuenta.estado === 'PAGADO') {
                                doc.fillColor('green');
                            }
                            doc.text(cuenta.estado, startX + 340, yRow, { width: 70 });
                            doc.fillColor('black');

                            doc.moveDown(0.3);
                        });
                    }

                    doc.moveDown(1);
                });

                // ============================================
                // 📌 PIE DE PÁGINA CON INDICADORES
                // ============================================
                const totalClientesConDeuda = data.filter(c => c.saldoTotal > 0).length;
                const porcentajeMorosidad = data.length > 0 ? (totalClientesConDeuda / data.length) * 100 : 0;

                doc.addPage();
                doc.fontSize(10);
                doc.font('Helvetica-Bold');
                doc.text('INDICADORES DE CARTERA', startX, doc.y);
                doc.moveDown(0.5);

                doc.font('Helvetica');
                doc.fontSize(9);
                doc.text(`Total de clientes: ${data.length}`, startX + 20, doc.y);
                doc.text(`Clientes con deuda pendiente: ${totalClientesConDeuda}`, startX + 20, doc.y + 15);
                doc.text(`Porcentaje de morosidad: ${porcentajeMorosidad.toFixed(2)}%`, startX + 20, doc.y + 30);
                doc.text(`Saldo total de cartera: $${totalGeneralSaldo.toFixed(2)}`, startX + 20, doc.y + 45);
                doc.text(`Promedio de deuda por cliente: $${(totalGeneralSaldo / (data.length || 1)).toFixed(2)}`, startX + 20, doc.y + 60);
                // 🔹 FIRMAS
                doc.fillColor('black');
                doc.moveDown(8);

                const firmaY = doc.y;
                const firmaWidth = 200;

                const responsableX = 120;
                const contadorX = 450;

                // Líneas
                doc.moveTo(responsableX, firmaY)
                    .lineTo(responsableX + firmaWidth, firmaY)
                    .stroke();

                doc.moveTo(contadorX, firmaY)
                    .lineTo(contadorX + firmaWidth, firmaY)
                    .stroke();

                // Textos
                doc.fontSize(10).font('Helvetica');

                doc.text(
                    'RESPONSABLE\nNombre: __________________',
                    responsableX,
                    firmaY + 15,
                    {
                        width: firmaWidth,
                        align: 'center',
                    }
                );

                doc.text(
                    'CONTADOR\nNombre: __________________',
                    contadorX,
                    firmaY + 15,
                    {
                        width: firmaWidth,
                        align: 'center',
                    }
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}