/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

@Injectable()
export class LibroMayorPdfService {
    constructor(
        private readonly prisma: PrismaClient
    ) { }

    async generarPdfLibroMayor(
        empresaId: number,
        data: any[],
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
                doc.moveDown(1);

                doc.fontSize(14).text('LIBRO MAYOR', { align: 'center' });

                if (filtros.fechaInicio && filtros.fechaFin) {
                    doc
                        .fontSize(10)
                        .text(
                            `Desde: ${filtros.fechaInicio.toISOString().split('T')[0]} Hasta: ${filtros.fechaFin.toISOString().split('T')[0]}`,
                            { align: 'center' }
                        );
                }

                doc.moveDown(2);

                // 🔁 RECORRER CUENTAS
                data.forEach((cuenta) => {
                    const startX = 40;

                    if (doc.y > 700) doc.addPage();

                    // 🧾 TÍTULO CUENTA
                    doc.font('Helvetica-Bold').fontSize(11);
                    doc.text(`${cuenta.codigo} - ${cuenta.nombre}`, startX, doc.y);
                    doc.moveDown(0.5);

                    // 🧾 CABECERA TABLA
                    doc.fontSize(9);
                    doc.text('Fecha', startX, doc.y, { width: 70 });
                    doc.text('Asiento', startX + 70, doc.y, { width: 60 });
                    doc.text('Concepto', startX + 130, doc.y, { width: 150 });
                    doc.text('Debe', startX + 290, doc.y, { width: 70, align: 'right' });
                    doc.text('Haber', startX + 360, doc.y, { width: 70, align: 'right' });
                    doc.text('Saldo', startX + 430, doc.y, { width: 70, align: 'right' });

                    doc.moveDown(0.2);
                    doc.moveTo(startX, doc.y).lineTo(540, doc.y).stroke();
                    doc.moveDown(0.5);

                    // 🔹 MOVIMIENTOS
                    doc.font('Helvetica');
                    let totalDebe = 0;
                    let totalHaber = 0;

                    cuenta.movimientos.forEach((mov) => {
                        if (doc.y > 750) {
                            doc.addPage();

                            doc.font('Helvetica-Bold').fontSize(9);
                            doc.text('Fecha', startX, doc.y, { width: 70 });
                            doc.text('Asiento', startX + 70, doc.y, { width: 60 });
                            doc.text('Concepto', startX + 130, doc.y, { width: 150 });
                            doc.text('Debe', startX + 290, doc.y, { width: 70, align: 'right' });
                            doc.text('Haber', startX + 360, doc.y, { width: 70, align: 'right' });
                            doc.text('Saldo', startX + 430, doc.y, { width: 70, align: 'right' });

                            doc.moveDown(0.2);
                            doc.moveTo(startX, doc.y).lineTo(540, doc.y).stroke();
                            doc.moveDown(0.5);

                            doc.font('Helvetica');
                        }

                        const yRow = doc.y;

                        doc.text(new Date(mov.fecha).toISOString().split('T')[0], startX, yRow, { width: 70 });
                        doc.text(mov.numero.toString(), startX + 70, yRow, { width: 60 });
                        doc.text(mov.concepto, startX + 130, yRow, { width: 150 });

                        doc.text(mov.debe.toFixed(2), startX + 290, yRow, { width: 70, align: 'right' });
                        doc.text(mov.haber.toFixed(2), startX + 360, yRow, { width: 70, align: 'right' });
                        doc.text(mov.saldo.toFixed(2), startX + 430, yRow, { width: 70, align: 'right' });

                        totalDebe += mov.debe;
                        totalHaber += mov.haber;

                        doc.moveDown(0.5);
                    });

                    // 🔹 TOTALES CUENTA
                    doc.moveDown(0.2);
                    doc.moveTo(startX + 280, doc.y).lineTo(540, doc.y).stroke();
                    doc.moveDown(0.5);

                    doc.font('Helvetica-Bold');
                    const yTotal = doc.y;

                    doc.text('Totales:', startX + 200, yTotal);
                    doc.text(totalDebe.toFixed(2), startX + 290, yTotal, { width: 70, align: 'right' });
                    doc.text(totalHaber.toFixed(2), startX + 360, yTotal, { width: 70, align: 'right' });

                    doc.moveDown(1.5);
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}