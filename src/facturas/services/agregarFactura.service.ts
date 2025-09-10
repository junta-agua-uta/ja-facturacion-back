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
      const secuencia = (maxResult._max.SECUENCIA || 0) + 1
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
            IVA: datos.iva || 0,
            TOTAL: datos.valorSinImpuesto + (datos.iva || 0),
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
      const dtoFactura = this.obtenerDtoFactura(facturaCreada)
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

  private obtenerDtoFactura(facturaCreada): InvoiceInputDto {
    const ambiente = process.env.AMBIENTE as '1' | '2'
    const tipoEmisi = '1'
    //cambiar a futuro para que traigaesta info desde bd
    const tipoIdentificacionComprador =
      facturaCreada.cliente.IDENTIFICACION.length === 10 ? '05' : '04'

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
        razonSocial: 'MANOBANDA YUGCHA JOSE FRANCISCO',
        ruc: '1891809449001',
        codDoc: '01',
        estab: '001',
        ptoEmi: '200',
        secuencial: facturaCreada.SECUENCIA.toString().padStart(9, '0'),
        dirMatriz: 'Ambato',
      },
      infoFactura: {
        fechaEmision: facturaCreada.FECHA_EMISION.toLocaleDateString('es-ES'),
        dirEstablecimiento: 'Ambato',
        obligadoContabilidad: 'NO',
        tipoIdentificacionComprador,
        guiaRemision: `${facturaCreada.ID_SUCURSAL.toString().padStart(3, '0')}-${facturaCreada.sucursal.PUNTO_EMISION}-${facturaCreada.SECUENCIA.toString().padStart(9, '0')}`,
        razonSocialComprador: facturaCreada.cliente.RAZON_SOCIAL,
        identificacionComprador: facturaCreada.cliente.IDENTIFICACION,
        direccionComprador: facturaCreada.cliente.DIRECCION,
        totalSinImpuestos: facturaCreada.VALOR_SIN_IMPUESTO.toString(),
        totalDescuento: facturaCreada.DETALLES_FACTURA.reduce(
          (total, detalle) => total + (detalle.DESCUENTO || 0),
          0,
        ).toString(),
        totalConImpuestos: {
          totalImpuesto: Object.values(
            facturaCreada.DETALLES_FACTURA.reduce(
              (acumulador, detalle) => {
                const ivaKey = detalle.razon.IVA.toString()
                if (!acumulador[ivaKey]) {
                  acumulador[ivaKey] = {
                    codigo: '2',
                    codigoPorcentaje: '0',
                    descuentoAdicional: '0.00',
                    baseImponible: 0,
                    valor: ivaKey,
                  }
                }
                acumulador[ivaKey].baseImponible += Number(detalle.SUBTOTAL)
                return acumulador
              },
              {} as Record<
                string,
                {
                  codigo: '2' | '3' | '5'
                  codigoPorcentaje: '0' | '2' | '3' | '4' | '6' | '7' | '8'
                  descuentoAdicional: string
                  baseImponible: number
                  valor: string
                }
              >,
            ) as TotalWithTaxDto[],
          ),
        },
        importeTotal: facturaCreada.TOTAL.toString(),
        moneda: 'dolar',
        pagos: {
          pago: [
            {
              formaPago,
              total: facturaCreada.TOTAL.toString(),
            },
          ],
        },
      },
      detalles: {
        detalle: facturaCreada.DETALLES_FACTURA.map((detalle) => ({
          codigoPrincipal: detalle.razon.CODIGO,
          codigoAuxiliar: 'OTR001',
          descripcion: detalle.DESCRIPCION,
          cantidad: detalle.CANTIDAD.toString(),
          precioUnitario: (detalle.SUBTOTAL / detalle.CANTIDAD).toString(),
          descuento: detalle.DESCUENTO.toString(),
          precioTotalSinImpuesto: detalle.SUBTOTAL.toString(),
          impuestos: {
            impuesto: {
              codigo: '2',
              codigoPorcentaje: '0',
              tarifa: '0.00',
              baseImponible: detalle.SUBTOTAL.toString(),
              valor: detalle.razon.IVA.toString(),
            },
          },
        })),
      },
    }
    return invoiceData
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
        this.obtenerDtoFactura(factura),
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
