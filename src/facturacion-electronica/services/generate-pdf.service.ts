import { Injectable, Logger } from '@nestjs/common'
import PDFDocument from 'pdfkit/js/pdfkit.standalone'
import { PdfDataDto, PdfItemDto } from '../interfaces/pdf-data.dto'
import * as path from 'path'
import * as fs from 'fs'
import {
  SRIAuthorizationDto,
  SRIResponseDto,
} from '../interfaces/sri-response.dto'
import { parseXMLtoJSON } from '../utils/autorizacion-code.util'
import * as xml2js from 'xml2js'
@Injectable()
export class GeneratePdfService {
  async generateInvoice(data: PdfDataDto): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 30 })

    const buffer: Buffer[] = []
    doc.on('data', (chunk) => buffer.push(chunk as Buffer))
    doc.on('end', () => Logger.log('PDF generado exitosamente'))

    // 🖼️ LOGO
    const logoPath = path.join(process.cwd(), 'assets', 'logo_agua.png')
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath)
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
      doc.image(ab, doc.page.width - 110, 20, { width: 70 })
    }

    // **Encabezado ajustado con altura dinámica**
    doc
      .fontSize(12)
      .text('DEMO', 30, 30, { width: 200 })
      .text('Dirección Matriz:', 30, 50)
      .fontSize(10)
      .text(data.comertialName, 30, 65, {
        width: 250,
        align: 'left',
        ellipsis: true,
      })
      .text('Correo:', 30, 120)
      .text('faqua2085@facturaqua.com', 30, 135, {
        width: 250,
        align: 'left',
        ellipsis: true,
      })
      .text('Obligado a Llevar Contabilidad:', 30, 150)
      .text(data.contabilidad, 30, 165, {
        width: 250,
        align: 'left',
        ellipsis: true,
      })

    let rightY = 100;
    doc
      .fontSize(10)
      .text('RUC:', 320, rightY)
      .text(data.ruc, 320, rightY + 15, { width: 240, align: 'left' })
      .text('Factura No.:', 320, rightY + 35)
      .text(data.invoiceNumber, 320, rightY + 50, { width: 240, align: 'left' })
      .text('Fecha Autorización:', 320, rightY + 70)
      .text(data.dateAuthorization, 320, rightY + 85, { width: 240, align: 'left' })
      .text('Ambiente:', 320, rightY + 105)
      .text(data.ambiente, 320, rightY + 120, { width: 240, align: 'left' })
      .text('Emisión:', 320, rightY + 140)
      .text(data.emition, 320, rightY + 155, { width: 240, align: 'left' })
      .text('Número de Autorización:', 320, rightY + 175)
      .text(data.authorizationNumber, 320, rightY + 190, { width: 240, align: 'left', ellipsis: true })
      .text('Clave de Acceso:', 320, rightY + 210)
      .text(data.accessKey, 320, rightY + 225, { width: 240, align: 'left', ellipsis: true })

    doc.moveDown()

    // **Información del cliente**
    doc
      .fontSize(10)
      .text('Nombres:', 30, 330)
      .text(data.clientName, 100, 330, { width: 200, ellipsis: true })
      .text('Dirección:', 30, 345)
      .text(data.clientAddress, 100, 345, { width: 200, ellipsis: true })
      .text('ID:', 30, 360)
      .text(data.clientId, 100, 360)
      .text('Email:', 30, 375)
      .text(data.clientEmail, 100, 375, { width: 200, ellipsis: true })
      .text('Fecha Emisión:', 320, 380)
      .text(data.dateEmition, 400, 380)

    doc.moveDown()

    // Línea separadora
    doc.moveTo(30, 400).lineTo(570, 400).stroke()

    // **Tabla de detalles ajustada**
    doc
      .fontSize(10)
      .text('Código', 30, 410)
      .text('Descripción', 100, 410)
      .text('Cantidad', 250, 410)
      .text('Precio Unitario', 350, 410)
      .text('Desc.', 450, 410)

    let yPosition = 430
    const maxRowsPerPage = 25 // Limitar filas por página
    let rowCount = 0

    data.items.forEach((item: PdfItemDto) => {
      if (yPosition > 700) {
        doc.addPage()
        yPosition = 30 // Reiniciar posición en la nueva página

        // Reimprimir encabezados de tabla
        doc
          .fontSize(10)
          .text('Código', 30, yPosition)
          .text('Descripción', 100, yPosition)
          .text('Cantidad', 250, yPosition)
          .text('Precio Unitario', 350, yPosition)
          .text('Desc.', 450, yPosition)
        yPosition += 20
      }

      let maxY = yPosition;
      
      doc.text(item.code, 30, yPosition)
      maxY = Math.max(maxY, doc.y);

      doc.text(item.description, 100, yPosition, {
        width: 140, // Reduced to prevent overlap with quantity (250 - 100 = 150)
        align: 'left'
      })
      maxY = Math.max(maxY, doc.y);

      doc.text(item.quantity.toString(), 250, yPosition)
      maxY = Math.max(maxY, doc.y);

      doc.text(item.unitPrice.toFixed(2), 350, yPosition)
      maxY = Math.max(maxY, doc.y);

      doc.text(item.descount.toFixed(2), 450, yPosition)
      maxY = Math.max(maxY, doc.y);

      yPosition = maxY + 5;
    })

    // Línea separadora
    doc.moveTo(30, yPosition).lineTo(570, yPosition).stroke()

    // **Totales**
    yPosition += 10
    const subTotal = data.subTotal || 0
    const descount = data.descount || 0
    const iva = data.iva || 0
    const total = data.total || 0

    doc
      .fontSize(10)
      .text('Subtotal:', 350, yPosition)
      .text(`$ ${subTotal.toFixed(2)}`, 450, yPosition)
      .text('Descuento:', 350, yPosition + 15)
      .text(`$ ${descount.toFixed(2)}`, 450, yPosition + 15)
      .text('IVA:', 350, yPosition + 30)
      .text(`$ ${iva.toFixed(2)}`, 450, yPosition + 30)
      .text('Valor Total:', 350, yPosition + 45)
      .text(`$ ${total.toFixed(2)}`, 450, yPosition + 45)

    // **Información adicional**
    yPosition += 70
    doc
      .fontSize(10)
      .text('Información Adicional:', 30, yPosition)
      .text('Vendedor: Junta de Agua', 30, yPosition + 15)
      .text('Ciudad: Ambato', 30, yPosition + 30)
      .text('Observaciones: Cobro Agua', 30, yPosition + 45)

    doc.end()

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffer)))
    })
  }

  async dataInvoice(sriResponse: [SRIAuthorizationDto, SRIResponseDto]) {
    const [, authorization] = sriResponse

    const response: SRIResponseDto = {
      RespuestaAutorizacionComprobante:
        authorization.RespuestaAutorizacionComprobante,
    }

    const data = await parseXMLtoJSON(
      response.RespuestaAutorizacionComprobante.autorizaciones.autorizacion
        .comprobante,
      xml2js,
    )

    const invoiceData = {
      comertialName: data.infoTributaria.nombreComercial,
      contabilidad: data.infoFactura.obligadoContabilidad,
      ruc: data.infoTributaria.ruc,
      invoiceNumber: data.infoFactura.guiaRemision,
      dateAuthorization:
        response.RespuestaAutorizacionComprobante.autorizaciones.autorizacion
          .fechaAutorizacion,
      ambiente:
        response.RespuestaAutorizacionComprobante.autorizaciones.autorizacion
          .ambiente,
      emition: 'NORMAL',
      authorizationNumber:
        response.RespuestaAutorizacionComprobante.autorizaciones.autorizacion
          .numeroAutorizacion,
      accessKey: data.infoTributaria.claveAcceso,
      clientName: data.infoFactura.razonSocialComprador,
      clientAddress: data.infoFactura.direccionComprador,
      clientId: data.infoFactura.identificacionComprador,
      dateEmition: data.infoFactura.fechaEmision,
      clientEmail: data.infoAdicional.campoAdicional._,
      phone: '-',
      items: Array.isArray(data.detalles.detalle)
        ? data.detalles.detalle.map((detalle: unknown) => {
            const d = detalle as {
              codigoPrincipal: string
              descripcion: string
              cantidad: string
              precioUnitario: string
              descuento: string
            }
            return {
              code: d.codigoPrincipal,
              description: d.descripcion,
              quantity: parseFloat(d.cantidad) || 0,
              unitPrice: parseFloat(d.precioUnitario) || 0,
              descount: parseFloat(d.descuento) || 0,
            }
          })
        : [
            {
              code: data.detalles.detalle.codigoPrincipal,
              description: data.detalles.detalle.descripcion,
              quantity: parseFloat(String(data.detalles.detalle.cantidad)) || 0,
              unitPrice:
                parseFloat(String(data.detalles.detalle.precioUnitario)) || 0,
              descount:
                parseFloat(String(data.detalles.detalle.descuento)) || 0,
            },
          ],
      subTotal: parseFloat(String(data.infoFactura.pagos.pago.total)) || 0,
      descount: parseFloat(String(data.infoFactura.totalDescuento)) || 0,
      iva: parseFloat('0.00') || 0,
      total: parseFloat(String(data.infoFactura.pagos.pago.total)) || 0,
    }

    const email = invoiceData.clientEmail

    const pdfBuffer = await this.generateInvoice(invoiceData)

    return { pdfBuffer, email }
  }
}
