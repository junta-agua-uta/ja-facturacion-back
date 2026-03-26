import { Injectable, Logger } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmailWithInvoices(email: string, pdf: Buffer, xml: string) {
    try {
      let recipient = email
      if (process.env.AMBIENTE === '1') {
        recipient = process.env.TEST_EMAIL || 'test@example.com'
        Logger.log(`MODO PRUEBAS: Redirigiendo correo de ${email} a ${recipient}`)
      }
      Logger.log(`Enviando factura a: ${recipient}`)
      await this.mailerService.sendMail({
        to: recipient,
        subject: '[TEST - SRI PRUEBAS] Recibo Electrónico Autorizado',
        text: `Este es un comprobante de PRUEBAS. Originalmente destinado a: ${email}. \n\nAdjuntamos su recibo. JUNTA ADMINISTRADORA DE AGUA POTABLE SAN VICENTE YACULOMA Y BELLAVISTA EL ROSARIO`,
        attachments: [
          {
            filename: 'factura.pdf',
            content: pdf,
            contentType: 'application/pdf',
          },
          {
            filename: 'factura.xml',
            content: xml,
            contentType: 'application/xml',
          },
        ],
      })
      return { success: true, message: 'Correo enviado exitosamente.' }
    } catch (error) {
      Logger.error('Error al enviar correo:', error)
      return { success: false, message: 'Error enviando el correo.', error }
    }
  }

  async sendEmail(email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Recibo Electrónico Autorizado',
        text: 'Adjuntamos su recibo. JUNTA ADMINISTRADORA DE AGUA POTABLE SAN VICENTE YACULOMA Y BELLAVISTA EL ROSARIO',
      })
      return { success: true, message: 'Correo enviado exitosamente.' }
    } catch (error) {
      Logger.error('Error al enviar correo:', error)
      return { success: false, message: 'Error enviando el correo.', error }
    }
  }
}
