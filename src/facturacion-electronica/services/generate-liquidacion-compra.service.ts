import { Injectable, Logger } from '@nestjs/common'
import { create } from 'xmlbuilder2'
import { LiquidacionCompraInputDto } from '../dto/liquidacion-compra.dto'

type EmisorForXml = {
  ruc: string
  razonSocial: string
  nombreComercial?: string | null
  dirMatriz: string
  estab: string
  ptoEmi: string
  obligadoContabilidad: string // 'SI' | 'NO'
}

type GenLiqParams = {
  emisor: EmisorForXml
  secuencial: string // Ej: '000000123'
  ambiente: string // '1' pruebas | '2' prod
}

@Injectable()
export class GenerateLiquidacionCompraService {
  private readonly logger = new Logger(GenerateLiquidacionCompraService.name)

  // -------- Utils IVA / Fecha ----------
  private parseFechaDDMMYYYY(fecha: string): Date {
    // espera dd/mm/yyyy
    const [dd, mm, yyyy] = fecha.split('/')
    // zona horaria -05:00 para evitar desfaces
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00-05:00`)
  }

  private resolveIvaPorFecha(fechaEmision: string) {
    // cambio a 15% desde 01/04/2024
    const cambio15 = new Date('2024-04-01T00:00:00-05:00')
    const fecha = this.parseFechaDDMMYYYY(fechaEmision)

    // IVA código 2 (IVA)
    // códigos porcentaje habituales: 0=0%, 2=12%, 3=14% (hist.), 4=15%
    if (fecha >= cambio15) {
      return { codigo: '2', codigoPorcentaje: '4', tarifa: 15 }
    }
    return { codigo: '2', codigoPorcentaje: '2', tarifa: 12 }
  }

  private to2(n: number | undefined | null): number {
    return Number(Number(n ?? 0).toFixed(2))
  }

  // ---- Normaliza detalles y totales con el IVA vigente ----
  private normalizeDataForXml(data: LiquidacionCompraInputDto): {
    dataForXml: LiquidacionCompraInputDto
    detallesNorm: any[]
  } {
    const ivaVigente = this.resolveIvaPorFecha(
      data.infoLiquidacionCompra.fechaEmision,
    )

    // Normaliza cada detalle
    const detallesNorm = (data.detalles || []).map((d: any) => {
      const cantidad = Number(d.cantidad ?? 0)
      const precioUnitario = Number(d.precioUnitario ?? 0)
      const descuento = Number(d.descuento ?? 0)

      // precioTotalSinImpuesto = cantidad * precio - descuento
      const precioTotalSinImpuesto = this.to2(
        cantidad * precioUnitario - descuento,
      )

      // base imponible para IVA
      const baseImponible = this.to2(d.baseImponible ?? precioTotalSinImpuesto)

      // Si el impuesto es IVA (codigo=2) aplicamos IVA vigente
      const isIVA = (d.codigoImpuesto ?? '2') === '2'
      const codigoImpuesto = '2' // IVA
      const codigoPorcentajeImpuesto = isIVA
        ? ivaVigente.codigoPorcentaje
        : d.codigoPorcentajeImpuesto
      const tarifaImpuesto = isIVA
        ? ivaVigente.tarifa
        : Number(d.tarifaImpuesto ?? 0)
      const valorImpuesto = isIVA
        ? this.to2((baseImponible * tarifaImpuesto) / 100)
        : this.to2(d.valorImpuesto ?? 0)

      return {
        ...d,
        cantidad: this.to2(cantidad),
        precioUnitario: this.to2(precioUnitario),
        descuento: this.to2(descuento),
        precioTotalSinImpuesto,
        codigoImpuesto,
        codigoPorcentajeImpuesto,
        tarifaImpuesto,
        baseImponible,
        valorImpuesto,
      }
    })

    // Totales
    const totalSinImpuestos = this.to2(
      detallesNorm.reduce(
        (acc, x: any) => acc + Number(x.precioTotalSinImpuesto ?? 0),
        0,
      ),
    )
    const totalDescuento = this.to2(
      data.infoLiquidacionCompra.totalDescuento ?? 0,
    )
    const totalIvaValor = this.to2(
      detallesNorm
        .filter((x: any) => x.codigoImpuesto === '2')
        .reduce((acc: number, x: any) => acc + Number(x.valorImpuesto ?? 0), 0),
    )
    const importeTotal = this.to2(totalSinImpuestos + totalIvaValor)

    const dataForXml: LiquidacionCompraInputDto = {
      ...data,
      infoLiquidacionCompra: {
        ...data.infoLiquidacionCompra,
        totalSinImpuestos,
        totalDescuento,
        importeTotal,
      },
      detalles: detallesNorm,
    }

    return { dataForXml, detallesNorm }
  }

  /**
   * Genera el XML de la liquidación de compra (con datos ya normalizados)
   */
  generateLiquidacionCompraXml(
    data: LiquidacionCompraInputDto,
    emailProveedor: string,
    accessKey: string,
    { emisor, secuencial, ambiente }: GenLiqParams,
  ): string {
    const formatNumber = (num: number) => Number(num ?? 0).toFixed(2)

    // Normaliza antes de construir XML
    const { dataForXml, detallesNorm } = this.normalizeDataForXml(data)

    const liquidacion = {
      liquidacionCompra: {
        '@id': 'comprobante',
        '@version': '1.1.0',
        infoTributaria: {
          ambiente, // desde parámetro
          tipoEmision: '1',
          razonSocial: emisor.razonSocial,
          nombreComercial: emisor.nombreComercial || emisor.razonSocial,
          ruc: emisor.ruc,
          claveAcceso: accessKey,
          codDoc: '03',
          estab: emisor.estab,
          ptoEmi: emisor.ptoEmi,
          secuencial, // desde secuencial_doc
          dirMatriz: emisor.dirMatriz,
        },
        infoLiquidacionCompra: {
          fechaEmision: dataForXml.infoLiquidacionCompra.fechaEmision,
          dirEstablecimiento:
            dataForXml.infoLiquidacionCompra.dirEstablecimiento,
          // contribuyenteEspecial: emisor.contribuyenteEspecial, // si lo necesitas
          obligadoContabilidad: emisor.obligadoContabilidad,
          tipoIdentificacionProveedor:
            dataForXml.infoLiquidacionCompra.tipoIdentificacionProveedor,
          razonSocialProveedor:
            dataForXml.infoLiquidacionCompra.razonSocialProveedor,
          identificacionProveedor:
            dataForXml.infoLiquidacionCompra.identificacionProveedor,
          direccionProveedor:
            dataForXml.infoLiquidacionCompra.direccionProveedor || '',
          totalSinImpuestos: formatNumber(
            dataForXml.infoLiquidacionCompra.totalSinImpuestos,
          ),
          totalDescuento: formatNumber(
            dataForXml.infoLiquidacionCompra.totalDescuento,
          ),
          totalConImpuestos: {
            totalImpuesto: detallesNorm
              .filter((d: any) => d.codigoImpuesto === '2') // solo IVA
              .map((d: any) => ({
                codigo: d.codigoImpuesto,
                codigoPorcentaje: d.codigoPorcentajeImpuesto,
                baseImponible: formatNumber(d.baseImponible),
                valor: formatNumber(d.valorImpuesto),
              })),
          },
          importeTotal: formatNumber(
            dataForXml.infoLiquidacionCompra.importeTotal,
          ),
          moneda: dataForXml.infoLiquidacionCompra.moneda,
        },
        detalles: {
          detalle: detallesNorm.map((d: any) => ({
            codigoPrincipal: d.codigoPrincipal,
            codigoAuxiliar: d.codigoAuxiliar || '',
            descripcion: d.descripcion,
            unidadMedida: d.unidadMedida || '',
            cantidad: formatNumber(d.cantidad),
            precioUnitario: formatNumber(d.precioUnitario),
            descuento: formatNumber(d.descuento ?? 0),
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
          campoAdicional: [
            { '@nombre': 'emailProveedor', '#': emailProveedor },
          ],
        },
      },
    }

    return create({ version: '1.0', encoding: 'UTF-8' }, liquidacion).end({
      prettyPrint: true,
    })
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
    const f = fecha.replace(/\//g, '') // asume dd/mm/aaaa; ajusta si usas otro formato
    const codigoNumerico = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString()

    let clave =
      `${f}${tipoComprobante}${ruc.padStart(13, '0')}` +
      `${ambiente}${serie}${numeroComprobante}${codigoNumerico}${tipoEmision}`

    // dígito verificador (módulo 11)
    const pesos = [2, 3, 4, 5, 6, 7]
    let suma = 0
    let j = 0
    for (let i = clave.length - 1; i >= 0; i--) {
      suma += parseInt(clave[i], 10) * pesos[j]
      j = (j + 1) % pesos.length
    }
    let digito = 11 - (suma % 11)
    if (digito === 11) digito = 0
    if (digito === 10) digito = 1

    clave += digito.toString()
    return clave
  }

  /**
   * Genera la liquidación de compra con claveAcceso y XML listo
   */
  generateLiquidacionCompra(
    data: LiquidacionCompraInputDto,
    emailProveedor: string,
    { emisor, secuencial, ambiente }: GenLiqParams,
  ) {
    const fecha = data.infoLiquidacionCompra.fechaEmision
    const tipoComprobante = '03'
    const ruc = emisor.ruc
    const serie = emisor.estab + emisor.ptoEmi
    const numeroComprobante = secuencial // ya viene con padStart(9, '0')
    const tipoEmision = '1'

    const accessKey = this.generateClaveAcceso(
      fecha,
      tipoComprobante,
      ruc,
      ambiente,
      serie,
      numeroComprobante,
      tipoEmision,
    )

    this.logger.log(`Clave de acceso generada: ${accessKey}`)

    const xml = this.generateLiquidacionCompraXml(
      data,
      emailProveedor,
      accessKey,
      { emisor, secuencial, ambiente },
    )

    return { xml, accessKey }
  }
}
