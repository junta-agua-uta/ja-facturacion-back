import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

@Injectable()
export class AsientoPdfService {
  constructor(private readonly prisma: PrismaClient) {}

  async generarPdfAsiento(idAsiento: number, empresaId: number): Promise<Buffer> {
    const asiento = await this.prisma.asiento.findUnique({
      where: { id: idAsiento },
      include: {
        detallesAsiento: {
          orderBy: { no: 'asc' },
        },
        periodo: true,
        creadoPor: true,
        aprobadoPor: true,
      },
    });

    if (!asiento || asiento.periodo.empresaId !== empresaId) {
      throw new NotFoundException('Asiento no encontrado o no pertenece a la empresa.');
    }

    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Encabezado
        doc.fontSize(16).text(empresa?.nombre || 'Empresa Generica', { align: 'center', bold: true });
        doc.fontSize(10).text(`RUC: ${empresa?.ruc || '9999999999001'}`, { align: 'center' });
        doc.moveDown(2);

        // Título
        doc.fontSize(14).text(`COMPROBANTE DE DIARIO No. ${asiento.numero}`, { align: 'center', bold: true });
        doc.moveDown(1);

        // Datos Generales
        doc.fontSize(10);
        const startX = 40;
        let startY = doc.y;

        doc.text(`Fecha: ${asiento.fecha.toISOString().split('T')[0]}`, startX, startY);
        doc.text(`Estado: ${asiento.estado}`, startX + 250, startY);
        startY += 15;
        doc.text(`Concepto: ${asiento.concepto}`, startX, startY, { width: 450 });
        startY += 30;

        doc.y = startY;

        // Tabla de detalles (Encabezados)
        doc.font('Helvetica-Bold');
        doc.text('CÓDIGO', startX, doc.y, { width: 80 });
        doc.text('CUENTA', startX + 80, doc.y, { width: 170 });
        doc.text('REF.', startX + 260, doc.y, { width: 60 });
        doc.text('DEBE', startX + 330, doc.y, { width: 80, align: 'right' });
        doc.text('HABER', startX + 420, doc.y, { width: 80, align: 'right' });
        doc.moveDown(0.5);

        // Línea separadora
        doc.moveTo(startX, doc.y).lineTo(540, doc.y).stroke();
        doc.moveDown(0.5);

        // Filas de detalles
        doc.font('Helvetica');
        let totalDebe = 0;
        let totalHaber = 0;

        asiento.detallesAsiento.forEach((detalle) => {
          const yRow = doc.y;
          doc.text(detalle.codcta, startX, yRow, { width: 80 });
          doc.text(detalle.nombre, startX + 80, yRow, { width: 170 });
          doc.text(detalle.referencia || '', startX + 260, yRow, { width: 60 });
          doc.text(Number(detalle.debe).toFixed(2), startX + 330, yRow, { width: 80, align: 'right' });
          doc.text(Number(detalle.haber).toFixed(2), startX + 420, yRow, { width: 80, align: 'right' });
          
          totalDebe += Number(detalle.debe);
          totalHaber += Number(detalle.haber);
          
          doc.moveDown(0.5);
        });

        // Línea separadora final
        doc.moveDown(0.5);
        doc.moveTo(startX, doc.y).lineTo(540, doc.y).stroke();
        doc.moveDown(0.5);

        // Totales
        doc.font('Helvetica-Bold');
        const yTotal = doc.y;
        doc.text('TOTALES:', startX + 100, yTotal);
        doc.text(totalDebe.toFixed(2), startX + 330, yTotal, { width: 80, align: 'right' });
        doc.text(totalHaber.toFixed(2), startX + 420, yTotal, { width: 80, align: 'right' });
        doc.moveDown(3);

        // Firmas
        const yFirmas = doc.y + 40;
        doc.font('Helvetica');
        doc.moveTo(startX + 50, yFirmas).lineTo(startX + 200, yFirmas).stroke();
        doc.text('Elaborado por', startX + 50, yFirmas + 5, { width: 150, align: 'center' });
        doc.text(`${asiento.creadoPor?.NOMBRE || ''} ${asiento.creadoPor?.APELLIDO || ''}`, startX + 50, yFirmas + 20, { width: 150, align: 'center' });

        doc.moveTo(startX + 300, yFirmas).lineTo(startX + 450, yFirmas).stroke();
        doc.text('Aprobado por', startX + 300, yFirmas + 5, { width: 150, align: 'center' });
        if (asiento.aprobadoPor) {
          doc.text(`${asiento.aprobadoPor.NOMBRE} ${asiento.aprobadoPor.APELLIDO}`, startX + 300, yFirmas + 20, { width: 150, align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
