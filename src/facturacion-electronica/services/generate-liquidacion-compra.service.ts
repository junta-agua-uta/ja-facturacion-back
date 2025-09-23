import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { LiquidacionCompraInputDto } from '../dto/liquidacion-compra.dto';

@Injectable()
export class GenerateLiquidacionCompraService {
  private readonly logger = new Logger(GenerateLiquidacionCompraService.name);

  // Datos del emisor (quemados para el ejemplo)
  private readonly empresa = {
    razonSocial: 'MANOBANDA YUGCHA JOSE FRANCISCO',
    nombreComercial: 'Junta Administradora de Agua Potable Miñarica Santa Rosa',
    ruc: '1891809449001',
    dirMatriz: 'Santa Rosa',
    estab: '001',
    ptoEmi: '300',
    contribuyenteEspecial: '123',
    obligadoContabilidad: 'SI',
  };

  /**
   * Genera el XML de la liquidación de compra
   */
  generateLiquidacionCompraXml(
    data: LiquidacionCompraInputDto,
    emailProveedor: string,
    accessKey: string,
  ): string {
    const formatNumber = (num: number) => num.toFixed(2);

    const liquidacion = {
      liquidacionCompra: {
        '@id': 'comprobante',
        '@version': '1.1.0',
        infoTributaria: {
          ambiente: process.env.AMBIENTE || '1',
          tipoEmision: '1',
          razonSocial: this.empresa.razonSocial,
          nombreComercial: this.empresa.nombreComercial,
          ruc: this.empresa.ruc,
          claveAcceso: accessKey, 
          codDoc: '03',
          estab: this.empresa.estab,
          ptoEmi: this.empresa.ptoEmi,
          secuencial: '000000001',
          dirMatriz: this.empresa.dirMatriz,
        },
        infoLiquidacionCompra: {
          fechaEmision: data.infoLiquidacionCompra.fechaEmision,
          dirEstablecimiento: data.infoLiquidacionCompra.dirEstablecimiento,
          contribuyenteEspecial: this.empresa.contribuyenteEspecial,
          obligadoContabilidad: this.empresa.obligadoContabilidad,
          tipoIdentificacionProveedor:
            data.infoLiquidacionCompra.tipoIdentificacionProveedor,
          razonSocialProveedor:
            data.infoLiquidacionCompra.razonSocialProveedor,
          identificacionProveedor:
            data.infoLiquidacionCompra.identificacionProveedor,
          direccionProveedor: data.infoLiquidacionCompra.direccionProveedor || '',
          totalSinImpuestos: formatNumber(
            data.infoLiquidacionCompra.totalSinImpuestos,
          ),
          totalDescuento: formatNumber(
            data.infoLiquidacionCompra.totalDescuento,
          ),


          totalConImpuestos: {
            totalImpuesto: data.detalles.map((d) => ({
              codigo: d.codigoImpuesto,
              codigoPorcentaje: d.codigoPorcentajeImpuesto,
              baseImponible: formatNumber(d.baseImponible),
              valor: formatNumber(d.valorImpuesto),
            })),
          },

          importeTotal: formatNumber(data.infoLiquidacionCompra.importeTotal),
          moneda: data.infoLiquidacionCompra.moneda,
        },
        detalles: {
          detalle: data.detalles.map((d) => ({
            codigoPrincipal: d.codigoPrincipal,
            codigoAuxiliar: d.codigoAuxiliar || '',
            descripcion: d.descripcion,
            unidadMedida: d.unidadMedida || '',
            cantidad: formatNumber(d.cantidad),
            precioUnitario: formatNumber(d.precioUnitario),
            descuento: formatNumber(d.descuento),
            precioTotalSinImpuesto: formatNumber(d.precioTotalSinImpuesto),
            impuestos: {
              impuesto: [
                {
                  codigo: d.codigoImpuesto,
                  codigoPorcentaje: d.codigoPorcentajeImpuesto,
                  tarifa: formatNumber(d.tarifaImpuesto),
                  baseImponible: formatNumber(d.baseImponible),
                  valor: formatNumber(d.valorImpuesto),
                },
              ],
            },
          })),
        },
        infoAdicional: {
          campoAdicional: [{ '@nombre': 'emailProveedor', '#': emailProveedor }],
        },
      },
    };

    return create({ version: '1.0', encoding: 'UTF-8' }, liquidacion).end({
      prettyPrint: true,
    });
  }

  /**
   * Genera la clave de acceso de 49 dígitos según normativa SRI
   */
  generateClaveAcceso(
    fecha: string,
    tipoComprobante: string,
    ruc: string,
    ambiente: string,
    serie: string,
    numeroComprobante: string,
    tipoEmision: string,
  ): string {
    const f = fecha.replace(/\//g, ''); 
    const codigoNumerico = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString();

    let clave = `${f}${tipoComprobante}${ruc.padStart(
      13,
      '0',
    )}${ambiente}${serie}${numeroComprobante}${codigoNumerico}${tipoEmision}`;

    // cálculo del dígito verificador módulo 11
    const pesos = [2, 3, 4, 5, 6, 7];
    let suma = 0;
    let j = 0;
    for (let i = clave.length - 1; i >= 0; i--) {
      suma += parseInt(clave[i], 10) * pesos[j];
      j = (j + 1) % pesos.length;
    }
    let digito = 11 - (suma % 11);
    if (digito === 11) digito = 0;
    if (digito === 10) digito = 1;

    clave += digito.toString();
    return clave;
  }

  /**
   * Genera la liquidación de compra con claveAcceso y XML listo
   */
  generateLiquidacionCompra(
    data: LiquidacionCompraInputDto,
    emailProveedor: string,
  ) {
    const fecha = data.infoLiquidacionCompra.fechaEmision;
    const tipoComprobante = '03';
    const ruc = this.empresa.ruc;
    const ambiente = process.env.AMBIENTE || '1';
    const serie = this.empresa.estab + this.empresa.ptoEmi;
    const numeroComprobante = '000000001';
    const tipoEmision = '1';

    const accessKey = this.generateClaveAcceso(
      fecha,
      tipoComprobante,
      ruc,
      ambiente,
      serie,
      numeroComprobante,
      tipoEmision,
    );

    this.logger.log(`Clave de acceso generada: ${accessKey}`);

    const xml = this.generateLiquidacionCompraXml(
      data,
      emailProveedor,
      accessKey,
    );

    return { xml, accessKey };
  }
}
