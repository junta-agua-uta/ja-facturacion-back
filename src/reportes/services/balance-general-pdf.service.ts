/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

@Injectable()
export class BalanceGeneralPdfService {
    constructor(
        private readonly prisma: PrismaClient
    ) { }

    async generarPdfBalanceGeneral(
        empresaId: number,
        data: {
            activos: any[];
            pasivos: any[];
            patrimonio: any[];
            totales: {
                activos: number;
                pasivos: number;
                patrimonio: number;
                pasivoMasPatrimonio: number;
            };
        },
        filtros: { periodoId?: number; fechaInicio?: Date; fechaFin?: Date }
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

                doc.fontSize(14).text('BALANCE GENERAL', { align: 'center' });

                if (filtros.fechaInicio && filtros.fechaFin) {
                    doc
                        .fontSize(10)
                        .text(
                            `Al ${filtros.fechaFin.toISOString().split('T')[0]}`,
                            { align: 'center' }
                        );
                }

                doc.moveDown(1.5);

                const startX = 40;
                const colWidths = {
                    codigo: 80,
                    cuenta: 280,
                    saldo: 100,
                };

                // ============================================
                // 📌 ACTIVOS
                // ============================================
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('ACTIVOS', startX, doc.y);
                doc.moveDown(0.5);

                // Cabecera
                doc.fontSize(9);
                doc.font('Helvetica-Bold');
                doc.text('Código', startX, doc.y, { width: colWidths.codigo });
                doc.text('Cuenta', startX + colWidths.codigo, doc.y, { width: colWidths.cuenta });
                doc.text('Saldo', startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.5);

                let totalActivos = 0;
                doc.font('Helvetica');

                data.activos.forEach((cuenta) => {
                    if (doc.y > 700) {
                        doc.addPage();
                        // Re-dibujar cabecera
                        doc.font('Helvetica-Bold').fontSize(9);
                        doc.text('Código', startX, doc.y, { width: colWidths.codigo });
                        doc.text('Cuenta', startX + colWidths.codigo, doc.y, { width: colWidths.cuenta });
                        doc.text('Saldo', startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });
                        doc.moveDown(0.3);
                        doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                        doc.moveDown(0.5);
                        doc.font('Helvetica');
                    }

                    const yRow = doc.y;
                    doc.text(cuenta.codigo, startX, yRow, { width: colWidths.codigo });
                    doc.text(cuenta.nombre, startX + colWidths.codigo, yRow, { width: colWidths.cuenta });
                    doc.text(cuenta.saldo.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, yRow, { width: colWidths.saldo, align: 'right' });

                    totalActivos += cuenta.saldo;
                    doc.moveDown(0.4);
                });

                // Total Activos
                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.3);

                doc.font('Helvetica-Bold');
                doc.text('TOTAL ACTIVOS', startX + colWidths.codigo + 50, doc.y);
                doc.text(totalActivos.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(1.5);

                // ============================================
                // 📌 PASIVOS
                // ============================================
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('PASIVOS', startX, doc.y);
                doc.moveDown(0.5);

                // Cabecera
                doc.fontSize(9);
                doc.font('Helvetica-Bold');
                doc.text('Código', startX, doc.y, { width: colWidths.codigo });
                doc.text('Cuenta', startX + colWidths.codigo, doc.y, { width: colWidths.cuenta });
                doc.text('Saldo', startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.5);

                let totalPasivos = 0;
                doc.font('Helvetica');

                data.pasivos.forEach((cuenta) => {
                    if (doc.y > 700) {
                        doc.addPage();
                        doc.font('Helvetica-Bold').fontSize(9);
                        doc.text('Código', startX, doc.y, { width: colWidths.codigo });
                        doc.text('Cuenta', startX + colWidths.codigo, doc.y, { width: colWidths.cuenta });
                        doc.text('Saldo', startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });
                        doc.moveDown(0.3);
                        doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                        doc.moveDown(0.5);
                        doc.font('Helvetica');
                    }

                    const yRow = doc.y;
                    doc.text(cuenta.codigo, startX, yRow, { width: colWidths.codigo });
                    doc.text(cuenta.nombre, startX + colWidths.codigo, yRow, { width: colWidths.cuenta });
                    doc.text(cuenta.saldo.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, yRow, { width: colWidths.saldo, align: 'right' });

                    totalPasivos += cuenta.saldo;
                    doc.moveDown(0.4);
                });

                // Total Pasivos
                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.3);

                doc.font('Helvetica-Bold');
                doc.text('TOTAL PASIVOS', startX + colWidths.codigo + 50, doc.y);
                doc.text(totalPasivos.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(1.5);

                // ============================================
                // 📌 PATRIMONIO
                // ============================================
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('PATRIMONIO', startX, doc.y);
                doc.moveDown(0.5);

                // Cabecera
                doc.fontSize(9);
                doc.font('Helvetica-Bold');
                doc.text('Código', startX, doc.y, { width: colWidths.codigo });
                doc.text('Cuenta', startX + colWidths.codigo, doc.y, { width: colWidths.cuenta });
                doc.text('Saldo', startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.5);

                let totalPatrimonio = 0;
                doc.font('Helvetica');

                data.patrimonio.forEach((cuenta) => {
                    if (doc.y > 700) {
                        doc.addPage();
                        doc.font('Helvetica-Bold').fontSize(9);
                        doc.text('Código', startX, doc.y, { width: colWidths.codigo });
                        doc.text('Cuenta', startX + colWidths.codigo, doc.y, { width: colWidths.cuenta });
                        doc.text('Saldo', startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });
                        doc.moveDown(0.3);
                        doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                        doc.moveDown(0.5);
                        doc.font('Helvetica');
                    }

                    const yRow = doc.y;
                    doc.text(cuenta.codigo, startX, yRow, { width: colWidths.codigo });
                    doc.text(cuenta.nombre, startX + colWidths.codigo, yRow, { width: colWidths.cuenta });
                    doc.text(cuenta.saldo.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, yRow, { width: colWidths.saldo, align: 'right' });

                    totalPatrimonio += cuenta.saldo;
                    doc.moveDown(0.4);
                });

                // Total Patrimonio
                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.3);

                doc.font('Helvetica-Bold');
                doc.text('TOTAL PATRIMONIO', startX + colWidths.codigo + 50, doc.y);
                doc.text(totalPatrimonio.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(1.5);

                // ============================================
                // 📌 ECUACIÓN CONTABLE
                // ============================================
                doc.moveDown(0.5);
                doc.fontSize(10);

                const pasivoMasPatrimonio = totalPasivos + totalPatrimonio;
                const diferencia = totalActivos - pasivoMasPatrimonio;
                const cuadra = diferencia === 0;

                doc.font('Helvetica-Bold');
                doc.text('VERIFICACIÓN DE ECUACIÓN CONTABLE:', startX, doc.y);
                doc.moveDown(0.5);

                doc.font('Helvetica');
                doc.fontSize(9);
                doc.text(`ACTIVOS = ${totalActivos.toFixed(2)}`, startX + 20, doc.y);
                doc.text(`PASIVOS + PATRIMONIO = ${pasivoMasPatrimonio.toFixed(2)}`, startX + 200, doc.y);
                doc.text(`DIFERENCIA = ${diferencia.toFixed(2)}`, startX + 400, doc.y);

                doc.moveDown(1);

                if (cuadra) {
                    doc.fillColor('green').fontSize(10).font('Helvetica-Bold')
                        .text('✓ LA ECUACIÓN CONTABLE CUADRA', { align: 'center' });
                } else {
                    doc.fillColor('red').fontSize(10).font('Helvetica-Bold')
                        .text('✗ LA ECUACIÓN CONTABLE NO CUADRA', { align: 'center' });
                    doc.moveDown(0.5);
                    doc.fontSize(9).fillColor('red')
                        .text(`La diferencia es de ${Math.abs(diferencia).toFixed(2)}`, { align: 'center' });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}