/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

@Injectable()
export class EstadoResultadosPdfService {
    constructor(
        private readonly prisma: PrismaClient
    ) { }

    async generarPdfEstadoResultados(
        empresaId: number,
        data: {
            ingresos: any[];
            gastos: any[];
            totales: {
                ingresos: number;
                gastos: number;
                utilidad: number;
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

                doc.fontSize(14).text('ESTADO DE RESULTADOS', { align: 'center' });

                if (filtros.fechaInicio && filtros.fechaFin) {
                    doc
                        .fontSize(10)
                        .text(
                            `Del ${filtros.fechaInicio.toISOString().split('T')[0]} al ${filtros.fechaFin.toISOString().split('T')[0]}`,
                            { align: 'center' }
                        );
                }

                doc.moveDown(1.5);

                const startX = 40;
                const colWidths = {
                    codigo: 80,
                    cuenta: 350,
                    saldo: 100,
                };

                // ============================================
                // 📌 INGRESOS
                // ============================================
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('INGRESOS', startX, doc.y);
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

                let totalIngresos = 0;
                doc.font('Helvetica');

                if (data.ingresos.length === 0) {
                    doc.text('No hay ingresos registrados', startX + 20, doc.y);
                    doc.moveDown(0.5);
                } else {
                    data.ingresos.forEach((cuenta) => {
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

                        totalIngresos += cuenta.saldo;
                        doc.moveDown(0.4);
                    });
                }

                // Total Ingresos
                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.3);

                doc.font('Helvetica-Bold');
                doc.text('TOTAL INGRESOS', startX + colWidths.codigo + 100, doc.y);
                doc.text(totalIngresos.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(1.5);

                // ============================================
                // 📌 GASTOS
                // ============================================
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('GASTOS', startX, doc.y);
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

                let totalGastos = 0;
                doc.font('Helvetica');

                if (data.gastos.length === 0) {
                    doc.text('No hay gastos registrados', startX + 20, doc.y);
                    doc.moveDown(0.5);
                } else {
                    data.gastos.forEach((cuenta) => {
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

                        totalGastos += cuenta.saldo;
                        doc.moveDown(0.4);
                    });
                }

                // Total Gastos
                doc.moveDown(0.3);
                doc.moveTo(startX, doc.y).lineTo(startX + colWidths.codigo + colWidths.cuenta + colWidths.saldo, doc.y).stroke();
                doc.moveDown(0.3);

                doc.font('Helvetica-Bold');
                doc.text('TOTAL GASTOS', startX + colWidths.codigo + 120, doc.y);
                doc.text(totalGastos.toFixed(2), startX + colWidths.codigo + colWidths.cuenta, doc.y, { width: colWidths.saldo, align: 'right' });

                doc.moveDown(2);

                // ============================================
                // 📌 UTILIDAD / PÉRDIDA NETA
                // ============================================
                const utilidad = totalIngresos - totalGastos;
                const esUtilidad = utilidad >= 0;

                doc.fontSize(11);
                doc.font('Helvetica-Bold');
                doc.text('RESULTADO DEL PERÍODO', startX, doc.y);
                doc.moveDown(0.5);

                doc.fontSize(12);
                if (esUtilidad) {
                    doc.fillColor('green');
                    doc.text(`UTILIDAD NETA: ${utilidad.toFixed(2)}`, startX + 20, doc.y);
                } else {
                    doc.fillColor('red');
                    doc.text(`PÉRDIDA NETA: ${Math.abs(utilidad).toFixed(2)}`, startX + 20, doc.y);
                }

                doc.moveDown(2);
                doc.fillColor('black');

                // ============================================
                // 📌 INDICADORES ADICIONALES
                // ============================================
                if (totalIngresos > 0) {
                    const margenUtilidad = (utilidad / totalIngresos) * 100;

                    doc.fontSize(10);
                    doc.font('Helvetica-Bold');
                    doc.text('INDICADORES FINANCIEROS', startX, doc.y);
                    doc.moveDown(0.5);

                    doc.font('Helvetica');
                    doc.text(`Margen de Utilidad: ${margenUtilidad.toFixed(2)}%`, startX + 20, doc.y);

                    // Indicador visual
                    doc.moveDown(0.3);
                    if (margenUtilidad > 20) {
                        doc.fillColor('green').text('✓ Margen saludable (>20%)', startX + 20, doc.y);
                    } else if (margenUtilidad > 10) {
                        doc.fillColor('orange').text('⚠ Margen moderado (10-20%)', startX + 20, doc.y);
                    } else if (margenUtilidad > 0) {
                        doc.fillColor('orange').text('⚠ Margen bajo (<10%)', startX + 20, doc.y);
                    } else {
                        doc.fillColor('red').text('✗ Pérdida en el período', startX + 20, doc.y);
                    }
                    doc.fillColor('black');
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}