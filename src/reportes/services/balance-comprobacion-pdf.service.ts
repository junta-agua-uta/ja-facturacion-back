/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

@Injectable()
export class BalanceComprobacionPdfService {
    constructor(
        private readonly prisma: PrismaClient
    ) { }

    async generarPdfBalanceComprobacion(
        empresaId: number,
        data: { cuentas: any[]; totales: { totalDebe: number; totalHaber: number } },
        filtros: { periodoId?: number; fechaInicio?: Date; fechaFin?: Date }
    ): Promise<Buffer> {
        const empresa = await this.prisma.empresa.findUnique({
            where: { id: empresaId },
        });

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
                const buffers: Buffer[] = [];

                doc.on('data', (chunk) => buffers.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // 🧾 ENCABEZADO
                doc.fontSize(16).text(empresa?.nombre || 'Empresa', { align: 'center' });
                doc.fontSize(10).text(`RUC: ${empresa?.ruc || '9999999999001'}`, { align: 'center' });
                doc.moveDown(0.5);

                doc.fontSize(14).text('BALANCE DE COMPROBACIÓN', { align: 'center' });

                if (filtros.fechaInicio && filtros.fechaFin) {
                    doc
                        .fontSize(10)
                        .text(
                            `Del ${filtros.fechaInicio.toISOString().split('T')[0]} al ${filtros.fechaFin.toISOString().split('T')[0]}`,
                            { align: 'center' }
                        );
                }

                doc.moveDown(1.5);

                // 🧾 CABECERA TABLA
                const startX = 40;
                const colWidths = {
                    codigo: 70,
                    cuenta: 180,
                    naturaleza: 60,
                    debe: 70,
                    haber: 70,
                    saldoDeudor: 70,
                    saldoAcreedor: 70,
                };

                let currentY = doc.y;

                doc.font('Helvetica-Bold').fontSize(9);
                doc.text('Código', startX, currentY, { width: colWidths.codigo });
                doc.text('Cuenta', startX + colWidths.codigo, currentY, { width: colWidths.cuenta });
                doc.text('Naturaleza', startX + colWidths.codigo + colWidths.cuenta, currentY, { width: colWidths.naturaleza });
                doc.text('Debe', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza, currentY, { width: colWidths.debe, align: 'right' });
                doc.text('Haber', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe, currentY, { width: colWidths.haber, align: 'right' });
                doc.text('Saldo Deudor', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe + colWidths.haber, currentY, { width: colWidths.saldoDeudor, align: 'right' });
                doc.text('Saldo Acreedor', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe + colWidths.haber + colWidths.saldoDeudor, currentY, { width: colWidths.saldoAcreedor, align: 'right' });

                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(750, doc.y).stroke();
                doc.moveDown(0.5);

                // 🔹 CUENTAS
                doc.font('Helvetica');
                let totalDebeGeneral = 0;
                let totalHaberGeneral = 0;

                data.cuentas.forEach((cuenta) => {
                    if (doc.y > 500) {
                        doc.addPage();
                        currentY = doc.y;

                        // Re-dibujar cabecera en página nueva
                        doc.font('Helvetica-Bold').fontSize(9);
                        doc.text('Código', startX, currentY, { width: colWidths.codigo });
                        doc.text('Cuenta', startX + colWidths.codigo, currentY, { width: colWidths.cuenta });
                        doc.text('Naturaleza', startX + colWidths.codigo + colWidths.cuenta, currentY, { width: colWidths.naturaleza });
                        doc.text('Debe', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza, currentY, { width: colWidths.debe, align: 'right' });
                        doc.text('Haber', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe, currentY, { width: colWidths.haber, align: 'right' });
                        doc.text('Saldo Deudor', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe + colWidths.haber, currentY, { width: colWidths.saldoDeudor, align: 'right' });
                        doc.text('Saldo Acreedor', startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe + colWidths.haber + colWidths.saldoDeudor, currentY, { width: colWidths.saldoAcreedor, align: 'right' });

                        doc.moveDown(0.3);
                        doc.moveTo(startX, doc.y).lineTo(750, doc.y).stroke();
                        doc.moveDown(0.5);
                        doc.font('Helvetica');
                    }

                    const yRow = doc.y;

                    doc.text(cuenta.codigo, startX, yRow, { width: colWidths.codigo });
                    doc.text(cuenta.nombre, startX + colWidths.codigo, yRow, { width: colWidths.cuenta });
                    doc.text(cuenta.naturaleza, startX + colWidths.codigo + colWidths.cuenta, yRow, { width: colWidths.naturaleza });
                    doc.text(cuenta.totalDebe.toFixed(2), startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza, yRow, { width: colWidths.debe, align: 'right' });
                    doc.text(cuenta.totalHaber.toFixed(2), startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe, yRow, { width: colWidths.haber, align: 'right' });
                    doc.text(cuenta.saldoDeudor.toFixed(2), startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe + colWidths.haber, yRow, { width: colWidths.saldoDeudor, align: 'right' });
                    doc.text(cuenta.saldoAcreedor.toFixed(2), startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe + colWidths.haber + colWidths.saldoDeudor, yRow, { width: colWidths.saldoAcreedor, align: 'right' });

                    totalDebeGeneral += cuenta.totalDebe;
                    totalHaberGeneral += cuenta.totalHaber;

                    doc.moveDown(0.4);
                });

                // 🔹 LÍNEA DE TOTALES
                doc.moveDown(0.5);
                doc.moveTo(startX, doc.y).lineTo(750, doc.y).stroke();
                doc.moveDown(0.5);

                const yTotal = doc.y;
                doc.font('Helvetica-Bold');
                doc.text('TOTALES GENERALES', startX + colWidths.codigo + colWidths.cuenta, yTotal, { width: colWidths.naturaleza + colWidths.debe + colWidths.haber - 30, align: 'right' });
                doc.text(totalDebeGeneral.toFixed(2), startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza, yTotal, { width: colWidths.debe, align: 'right' });
                doc.text(totalHaberGeneral.toFixed(2), startX + colWidths.codigo + colWidths.cuenta + colWidths.naturaleza + colWidths.debe, yTotal, { width: colWidths.haber, align: 'right' });

                doc.moveDown(1);

                // 🔹 VERIFICACIÓN DE CUADRATURA
                const cuadra = totalDebeGeneral === totalHaberGeneral;
                doc.fontSize(10);
                if (cuadra) {
                    doc.fillColor('green').text('✓ EL BALANCE CUADRA', { align: 'center' });
                } else {
                    doc.fillColor('red').text('✗ EL BALANCE NO CUADRA', { align: 'center' });
                    doc.moveDown(0.5);
                    doc.fontSize(9).fillColor('red').text(`Diferencia: ${Math.abs(totalDebeGeneral - totalHaberGeneral).toFixed(2)}`, { align: 'center' });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}