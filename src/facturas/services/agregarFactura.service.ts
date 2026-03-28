import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { CrearFacturaDto } from '../dtos/crearFactura.dto'
import { GenerateInvoiceService } from 'src/facturacion-electronica/services/generate-invoice.service'
import { InvoiceInputDto } from 'src/facturacion-electronica/interfaces/invoice.dto'
import { ElectronicInvoiceService } from 'src/facturacion-electronica/services/electronic-invoice.service'
import { TotalWithTaxDto } from 'src/facturacion-electronica/interfaces/invoice-info.dto'
import { DateUtil } from 'src/common/utils/date.util'

@Injectable()
export class AgregarFacturaService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly generateInvoiceService: GenerateInvoiceService,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
  ) {}

  async agregarFactura(datos: CrearFacturaDto) {
    try {
      const maxResult = await this.prisma.fACTURAS.aggregate({
        _max: {
          SECUENCIA: true, // Reemplaza 'nombreDeLaColumna' con el nombre real de tu columna
        },
      })
      const secuencia = datos.secuencia || (maxResult._max.SECUENCIA || 0) + 1
      // 1. Fetch VAT rates for all details to correctly calculate totals
      let totalIvaCalc = 0;
      for (const detalle of datos.detalles) {
        const razon = await this.prisma.rAZONES.findUnique({ where: { ID: detalle.idRazon } });
        if (razon && razon.IVA) {
          totalIvaCalc += (detalle.subtotal * Number(razon.IVA)) / 100;
        }
      }
      
      const ivaFinal = datos.iva !== undefined && datos.iva > 0 ? datos.iva : totalIvaCalc;
      const totalGeneral = datos.valorSinImpuesto + ivaFinal;

      // Crear la factura en la base de datos
      const nuevaFactura = await this.prisma.fACTURAS
        .create({
          data: {
            SECUENCIA: secuencia,
            FECHA_EMISION: DateUtil.getCurrentDate(),
            FECHA_VENCIMIENTO: DateUtil.getCurrentDate(),
            ID_SUCURSAL: datos.idSucursal,
            ID_USUARIO: datos.idUsuario,
            ID_CLIENTE: datos.idCliente,
            ID_MEDIDOR: datos.idMedidor,
            TIPO_PAGO: datos.tipoPago,
            VALOR_SIN_IMPUESTO: datos.valorSinImpuesto,
            IVA: ivaFinal,
            TOTAL: totalGeneral,
          },
        })
        .catch((error) => {
          throw new Error(`Error al crear la factura: ${error.message}`)
        })
      await Promise.all(
        datos.detalles.map(async (detalle) => {
          await this.prisma.dETALLES_FACTURA.create({
            data: {
              ID_FACTURA: nuevaFactura.ID,
              ID_RAZON: detalle.idRazon,
              DESCRIPCION: detalle.descripcion,
              CANTIDAD: detalle.cantidad,
              SUBTOTAL: detalle.subtotal,
              DESCUENTO: detalle.descuento,
              PRECIO_IVA: detalle.precioIva,
            },
          })
        }),
      )

      // Obtener la factura recién creada
      const facturaCreada = await this.prisma.fACTURAS.findUnique({
        where: {
          ID: nuevaFactura.ID,
        },
        include: {
          sucursal: true,
          cliente: true,
          medidor: true,
          usuario: true,
          DETALLES_FACTURA: {
            include: {
              razon: true,
            },
          },
        },
      })
      Logger.log(facturaCreada.FECHA_EMISION)
      const dtoFactura = await this.obtenerDtoFactura(facturaCreada)
      const facturaElectronica = this.generateInvoiceService.generateInvoice(
        dtoFactura,
        facturaCreada.cliente.CORREO,
      )
      const accessKey = facturaElectronica.accessKey
      await this.prisma.fACTURAS.update({
        where: {
          ID: facturaCreada.ID,
        },
        data: {
          CLAVE_ACCESO: accessKey,
        },
      })
      const response = await this.electronicInvoiceService.processInvoice(
        facturaElectronica.xml,
        accessKey,
      )
      if (response.pending) {
        await this.prisma.fACTURAS.update({
          where: { ID: facturaCreada.ID },
          data: {
            ESTADO_FACTURA: 'SIN_AUTORIZAR',
          },
        })
      }
      Logger.log('Respuesta final: ' + response.message)
      if (
        response.message ==
        'Factura procesada exitosamente y enviada al cliente.'
      ) {
        await this.prisma.fACTURAS.update({
          where: {
            ID: facturaCreada.ID,
          },
          data: {
            ESTADO_FACTURA: 'AUTORIZADO',
            FECHA_AUTORIZACION: DateUtil.getCurrentDate(),
          },
        })
      }

      return {
        mensaje: response.message,
        factura: facturaCreada,
        secuencia: dtoFactura.infoFactura.guiaRemision,
      }
    } catch (error) {
      throw new Error(`Error al crear la factura: ${error.message}`)
    }
  }

  private async obtenerDtoFactura(facturaCreada): Promise<InvoiceInputDto> {
    const emisorRuc = process.env.EMISOR_RUC
    const emisor = emisorRuc
      ? await this.prisma.emisor.findUnique({ where: { ruc: emisorRuc } })
      : await this.prisma.emisor.findFirst({ where: { activo: true } })

    if (!emisor) {
      throw new Error(
        'No se encontró Emisor configurado en la base de datos (revisa tabla "emisor")',
      )
    }

    const ambiente = (process.env.AMBIENTE || emisor.ambiente) as '1' | '2'
    const tipoEmisi = '1'
    //cambiar a futuro para que traigaesta info desde bd
    let identification = facturaCreada.cliente.IDENTIFICACION
    let tipoIdentificacionComprador: '04' | '05' | '07' = '05' // Cédula por defecto

    if (identification === '9999999999999' || identification === '9999999999') {
      tipoIdentificacionComprador = '07' // Consumidor Final
      identification = '9999999999999' // Force 13 digits for SRI
    } else if (identification.length === 13) {
      tipoIdentificacionComprador = '04' // RUC
    } else if (identification.length === 10) {
      tipoIdentificacionComprador = '05' // Cédula
    }

    let formaPago = ''
    switch (facturaCreada.TIPO_PAGO) {
      case 'EFECTIVO':
        formaPago = '01'
        break
      case 'CREDITO':
        formaPago = '19'
        break
      case 'DEPOSITO':
        formaPago = '20'
        break
      case 'CHEQUE':
        formaPago = '20'
        break
      default:
        formaPago = '01'
        break
    }

    //cambiar a futuro para que traigaesta info desde bd
    const invoiceData: InvoiceInputDto = {
      infoTributaria: {
        ambiente,
        tipoEmision: tipoEmisi,
        razonSocial: emisor.razonSocial,
        ruc: emisor.ruc,
        codDoc: '01',
        estab: emisor.estab,
        ptoEmi: emisor.ptoEmi,
        secuencial: facturaCreada.SECUENCIA.toString().padStart(9, '0'),
        dirMatriz: emisor.dirMatriz,
      },
      infoFactura: {
        fechaEmision: facturaCreada.FECHA_EMISION.toLocaleDateString('es-ES', {
          timeZone: 'America/Guayaquil',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        dirEstablecimiento: 'Ambato',
        obligadoContabilidad: 'NO',
        tipoIdentificacionComprador,
        guiaRemision: `${facturaCreada.ID_SUCURSAL.toString().padStart(3, '0')}-${facturaCreada.sucursal.PUNTO_EMISION}-${facturaCreada.SECUENCIA.toString().padStart(9, '0')}`,
        razonSocialComprador: this.cleanString(facturaCreada.cliente.RAZON_SOCIAL),
        identificacionComprador: identification,
        direccionComprador: this.cleanString(facturaCreada.cliente.DIRECCION),
        totalSinImpuestos: facturaCreada.VALOR_SIN_IMPUESTO.toFixed(2),
        totalDescuento: facturaCreada.DETALLES_FACTURA.reduce(
          (total, detalle) => total + (detalle.DESCUENTO || 0),
          0,
        ).toFixed(2),
        totalConImpuestos: {
          totalImpuesto: Object.values(
            facturaCreada.DETALLES_FACTURA.reduce(
              (acumulador, detalle) => {
                const ivaValue = Number(detalle.razon.IVA)
                const ivaKey = ivaValue.toString()
                if (!acumulador[ivaKey]) {
                  acumulador[ivaKey] = {
                    codigo: '2',
                    codigoPorcentaje: this.getIvaCode(ivaValue),
                    descuentoAdicional: '0.00',
                    baseImponible: 0,
                    valor: '0', // Will be calculated below
                  }
                }
                acumulador[ivaKey].baseImponible += Number(detalle.SUBTOTAL)
                acumulador[ivaKey].valor = (
                  (acumulador[ivaKey].baseImponible * ivaValue) /
                  100
                ).toFixed(2)
                return acumulador
              },
              {} as Record<
                string,
                {
                  codigo: '2' | '3' | '5'
                  codigoPorcentaje: '0' | '2' | '3' | '4' | '6' | '7' | '8'
                  descuentoAdicional: string
                  baseImponible: number | string
                  valor: string
                }
              >,
            ) as TotalWithTaxDto[],
          ).map(impuesto => ({
            ...impuesto,
            baseImponible: Number(impuesto.baseImponible).toFixed(2)
          })),
        },
        importeTotal: facturaCreada.TOTAL.toFixed(2),
        moneda: 'dolar',
        pagos: {
          pago: [
            {
              formaPago,
              total: facturaCreada.TOTAL.toFixed(2),
            },
          ],
        },
      },
      detalles: {
        detalle: facturaCreada.DETALLES_FACTURA.map((detalle) => ({
          codigoPrincipal: detalle.razon.CODIGO,
          codigoAuxiliar: 'OTR001',
          descripcion: this.cleanString(detalle.DESCRIPCION || 'PRODUCTO'),
          cantidad: detalle.CANTIDAD.toFixed(6),
          precioUnitario: (detalle.SUBTOTAL / detalle.CANTIDAD).toFixed(6),
          descuento: detalle.DESCUENTO.toFixed(2),
          precioTotalSinImpuesto: detalle.SUBTOTAL.toFixed(2),
          impuestos: {
            impuesto: {
              codigo: '2',
              codigoPorcentaje: this.getIvaCode(Number(detalle.razon.IVA)),
              tarifa: Number(detalle.razon.IVA).toFixed(2),
              baseImponible: detalle.SUBTOTAL.toFixed(2),
              valor: (
                (Number(detalle.SUBTOTAL) * Number(detalle.razon.IVA)) /
                100
              ).toFixed(2),
            },
          },
        })),
      },
    }
    return invoiceData
  }

  private cleanString(str: string): string {
    if (!str) return 'S/N'
    return str
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
      .replace(/\?+/g, '') // Remove question marks from bad encoding
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim() || 'S/N'
  }

  private getIvaCode(
    ivaValue: number,
  ): '0' | '2' | '3' | '4' | '5' | '6' | '7' | '8' {
    const val = Number(ivaValue)
    if (val === 0) return '0'
    if (val === 12) return '2'
    if (val === 14) return '3'
    if (val === 15) return '4'
    if (val === 5) return '5'
    return '0' // Default to 0% if unknown
  }

  async autorizarFactura(idfac: number, isComplete: boolean = true) {
    try {
      const factura = await this.prisma.fACTURAS.findUnique({
        where: {
          ID: idfac,
        },
        include: {
          sucursal: true,
          cliente: true,
          medidor: true,
          usuario: true,
          DETALLES_FACTURA: {
            include: {
              razon: true,
            },
          },
        },
      })
      if (!factura) {
        throw new Error('Factura no encontrada')
      }

      const facturaElectronica = this.generateInvoiceService.generateInvoice(
        await this.obtenerDtoFactura(factura),
        factura.cliente.CORREO,
      )

      let response
      if (isComplete) {
        response = await this.electronicInvoiceService.processInvoice(
          facturaElectronica.xml,
          facturaElectronica.accessKey,
        )
      } else {
        const claveAcceso = await this.prisma.fACTURAS
          .findUnique({
            where: {
              ID: idfac,
            },
            select: {
              CLAVE_ACCESO: true,
            },
          })
          .catch((error) => {
            throw new Error(
              `Error al obtener la clave de acceso: ${error.message}`,
            )
          })

        response = await this.electronicInvoiceService.authorizeInvoice(
          claveAcceso.CLAVE_ACCESO,
        )

        facturaElectronica.accessKey = claveAcceso.CLAVE_ACCESO
      }

      if (
        response.message ==
        'Factura procesada exitosamente y enviada al cliente.'
      ) {
        return await this.prisma.fACTURAS.update({
          where: {
            ID: factura.ID,
          },
          data: {
            ESTADO_FACTURA: 'AUTORIZADO',
            FECHA_AUTORIZACION: DateUtil.getCurrentDate(),
            CLAVE_ACCESO: facturaElectronica.accessKey,
          },
        })
      } else {
        return response.message
      }
    } catch (error) {
      throw new Error(`Error al autorizar la factura: ${error.message}`)
    }
  }
}
