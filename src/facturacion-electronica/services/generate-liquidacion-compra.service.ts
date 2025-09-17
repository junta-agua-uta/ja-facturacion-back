import { Injectable, Logger } from '@nestjs/common'
import { create } from 'xmlbuilder2'
import { generateAccessKey } from 'src/facturacion-electronica/utils/autorizacion-code.util'
import {
  LiquidacionCompraDto,
  LiquidacionCompraInputDto,
} from 'src/facturacion-electronica/dto/liquidacion-compra.dto'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class GenerateLiquidacionCompraService {
  generateLiquidacionCompraXml(liquidacion: LiquidacionCompraDto) {
    const document = create({ version: '1.0', encoding: 'UTF-8' }, liquidacion)
    const xml = document.end({ prettyPrint: true })
    return xml
  }

  generateLiquidacionCompra(
    data: LiquidacionCompraInputDto,
    emailProveedor: string,
  ) {
    // Normalizar fecha dd/mm/yyyy
    const [day, month, year] = data.infoLiquidacionCompra.fechaEmision
      .split('/')
      .map((part) => part.padStart(2, '0'))

    data.infoLiquidacionCompra.fechaEmision = `${day}/${month}/${year}`

    const formattedDateStr = `${year}-${month}-${day}`
    const date = DateUtil.getLocalDate(new Date(formattedDateStr))
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset())

    const accessKey = generateAccessKey({
      date,
      codDoc: data.infoTributaria.codDoc,
      ruc: data.infoTributaria.ruc,
      environment: data.infoTributaria.ambiente,
      establishment: data.infoTributaria.estab,
      emissionPoint: data.infoTributaria.ptoEmi,
      sequential: data.infoTributaria.secuencial,
    })
    Logger.log(accessKey)

    const {
      ambiente,
      tipoEmision,
      razonSocial,
      nombreComercial,
      ruc,
      codDoc,
      estab,
      ptoEmi,
      secuencial,
      dirMatriz,
    } = data.infoTributaria

    const infoTributaria = {
      ambiente,
      tipoEmision,
      razonSocial,
      nombreComercial,
      ruc,
      claveAcceso: accessKey,
      codDoc,
      estab,
      ptoEmi,
      secuencial,
      dirMatriz,
    }

    const liquidacion: LiquidacionCompraDto = {
      liquidacionCompra: {
        '@id': 'comprobante',
        '@version': '1.1.0',
        infoTributaria,
        infoLiquidacionCompra: data.infoLiquidacionCompra,
        detalles: {
          detalle: data.detalles.map((d) => ({
            codigoPrincipal: d.codigoPrincipal,
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuento: d.descuento,
            precioTotalSinImpuesto: d.precioTotalSinImpuesto,
            impuestos: {
              impuesto: [
                {
                  codigo: d.codigoImpuesto,
                  codigoPorcentaje: d.codigoPorcentajeImpuesto,
                  tarifa: d.tarifaImpuesto,
                  baseImponible: d.baseImponible,
                  valor: d.valorImpuesto,
                },
              ],
            },
          })),
        },
        infoAdicional: {
          campoAdicional: [
            {
              '@nombre': 'emailProveedor',
              '#': emailProveedor,
            },
          ],
        },
      },
    } as unknown as LiquidacionCompraDto

    const xml = this.generateLiquidacionCompraXml(liquidacion)
    return { xml, accessKey }
  }

  createExampleLiquidacionCompra(): LiquidacionCompraInputDto {
    return {
      infoTributaria: {
        ambiente: '1',
        tipoEmision: '1',
        razonSocial: 'MI EMPRESA S.A.',
        nombreComercial: 'MI EMPRESA',
        ruc: '1790012345001',
        codDoc: '03',
        estab: '001',
        ptoEmi: '001',
        secuencial: '000000123',
        dirMatriz: 'Av. Siempre Viva 123',
      },
      infoLiquidacionCompra: {
        fechaEmision: '13/09/2025',
        dirEstablecimiento: 'Av. Siempre Viva 123',
        tipoIdentificacionProveedor: '05',
        razonSocialProveedor: 'Proveedor de Prueba',
        identificacionProveedor: '0102030405',
        totalSinImpuestos: 100,
        totalDescuento: 0,
        importeTotal: 112,
        moneda: 'DOLAR',
      },
      detalles: [
        {
          codigoPrincipal: 'PROD001',
          descripcion: 'Producto de ejemplo',
          cantidad: 10,
          precioUnitario: 10,
          descuento: 0,
          precioTotalSinImpuesto: 100,
          codigoImpuesto: '2',
          codigoPorcentajeImpuesto: '2',
          tarifaImpuesto: 12,
          baseImponible: 100,
          valorImpuesto: 12,
        },
      ],
    }
  }
}


