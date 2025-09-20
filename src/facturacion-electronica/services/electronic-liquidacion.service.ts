import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SignInvoiceService } from './sign-invoice.service';
import { GenerateLiquidacionCompraService } from './generate-liquidacion-compra.service';
import { GenerateInvoiceService } from './generate-invoice.service';
import { LiquidacionCompraInputDto } from '../dto/liquidacion-compra.dto';
import { SRIResponseDto, SRIAuthorizationDto } from '../interfaces/sri-response.dto';

@Injectable()
export class ElectronicLiquidacionService {
  private readonly logger = new Logger(ElectronicLiquidacionService.name);
  private sriReceptionUrl: string;
  private sriAuthorizationUrl: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly signService: SignInvoiceService,
    private readonly liquidacionService: GenerateLiquidacionCompraService,
    private readonly invoiceService: GenerateInvoiceService,
  ) {
    this.sriReceptionUrl = process.env.SRI_RECEPTION_URL_TEST || '';
    this.sriAuthorizationUrl = process.env.SRI_AUTHORIZATION_URL_TEST || '';
  }

  async enviarAlSRI(data: LiquidacionCompraInputDto, emailProveedor: string) {
    try {
      this.logger.log('Generando XML de liquidación de compra...');
      const { xml, accessKey } = this.liquidacionService.generateLiquidacionCompra(data, emailProveedor);

      // Guardar liquidación inicial
      const liquidacionDb = await this.prisma.liquidacionCompra.create({
        data: {
          fechaEmision: data.infoLiquidacionCompra.fechaEmision,
          dirEstablecimiento: data.infoLiquidacionCompra.dirEstablecimiento,
          tipoIdentificacionProveedor: data.infoLiquidacionCompra.tipoIdentificacionProveedor,
          razonSocialProveedor: data.infoLiquidacionCompra.razonSocialProveedor,
          identificacionProveedor: data.infoLiquidacionCompra.identificacionProveedor,
          totalSinImpuestos: data.infoLiquidacionCompra.totalSinImpuestos,
          totalDescuento: data.infoLiquidacionCompra.totalDescuento,
          importeTotal: data.infoLiquidacionCompra.importeTotal,
          moneda: data.infoLiquidacionCompra.moneda,
          xml,
          accessKey,
          estadoSri: 'GENERADO',
          detalles: {
            create: data.detalles.map((d) => ({
              codigoPrincipal: d.codigoPrincipal,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              descuento: d.descuento,
              precioTotalSinImpuesto: d.precioTotalSinImpuesto,
              codigoImpuesto: d.codigoImpuesto,
              codigoPorcentajeImpuesto: d.codigoPorcentajeImpuesto,
              tarifaImpuesto: d.tarifaImpuesto,
              baseImponible: d.baseImponible,
              valorImpuesto: d.valorImpuesto,
            })),
          },
        },
        include: { detalles: true },
      });

      this.logger.log('Firmando XML...');
      const p12 = this.signService.getP12Certificate();
      const password = process.env.SIGNATURE_PASSWORD;
      const signedXml = this.signService.signXml(p12, password, xml);

      this.logger.log('Enviando a recepción del SRI...');
      const reception: SRIAuthorizationDto = await this.invoiceService.documentReception(signedXml, this.sriReceptionUrl);

      if (!reception || reception.RespuestaRecepcionComprobante.estado !== 'RECIBIDA') {
        await this.prisma.liquidacionCompra.update({
          where: { id: liquidacionDb.id },
          data: { estadoSri: 'NO_RECIBIDA' },
        });
        return { success: false, message: 'Error en recepción del SRI', detalles: reception?.RespuestaRecepcionComprobante, accessKey };
      }

      this.logger.log('Consultando autorización del SRI...');
      const authorization: SRIResponseDto = await this.invoiceService.documentAuthorization(accessKey, this.sriAuthorizationUrl);
      const autorizacion = authorization?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        await this.prisma.liquidacionCompra.update({
          where: { id: liquidacionDb.id },
          data: { estadoSri: autorizacion?.estado || 'NO_AUTORIZADO' },
        });
        return { success: false, message: 'Documento no autorizado por el SRI', detalles: autorizacion, accessKey };
      }

      await this.prisma.liquidacionCompra.update({
        where: { id: liquidacionDb.id },
        data: { estadoSri: 'AUTORIZADO', xml: autorizacion.comprobante },
      });

      return { success: true, message: 'Liquidación autorizada', estado: autorizacion.estado, accessKey, authorizedXml: autorizacion.comprobante };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error al enviar liquidación al SRI: ' + msg);
      return { success: false, message: 'Error al enviar al SRI: ' + msg };
    }
  }

  async autorizarPorClave(accessKey: string) {
    try {
      const authorization: SRIResponseDto = await this.invoiceService.documentAuthorization(accessKey, this.sriAuthorizationUrl);
      const autorizacion = authorization?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        return { success: false, message: 'Documento no autorizado por el SRI', detalles: autorizacion };
      }

      return { success: true, message: 'Documento autorizado por el SRI', estado: autorizacion.estado, authorizedXml: autorizacion.comprobante };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error al consultar autorización: ' + msg);
      return { success: false, message: 'Error al consultar autorización: ' + msg };
    }
  }
}
