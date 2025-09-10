import { ApiProperty } from '@nestjs/swagger'
import { TaxInfoDto } from '../interfaces/tax-info.dto'
import { InvoiceInfoDto } from '../interfaces/invoice-info.dto'
import { AdditionalDetailDto, DetailsDto } from '../interfaces/details.dto'

export class InfoTributariaDto {
  @ApiProperty({
    description: 'Ambiente (1: Pruebas, 2: Producción)',
    example: '2',
  })
  ambiente: string

  @ApiProperty({ description: 'Tipo de emisión', example: '1' })
  tipoEmision: string

  @ApiProperty({
    description: 'Razón social del emisor',
    example: 'MANOBANDA YUGCHA JOSE FRANCISCO',
  })
  razonSocial: string

  @ApiProperty({
    description: 'Nombre comercial del emisor',
    example:
      'JUNTA ADMINISTRADORA DE AGUA POTABLE MIÑARICA SAN VICENTE YACULOMA Y BELLAVISTA EL ROSARIO',
  })
  nombreComercial: string

  @ApiProperty({ description: 'RUC del emisor', example: '1891809449001' })
  ruc: string

  @ApiProperty({ description: 'Clave de acceso', example: '' })
  claveAcceso: string

  @ApiProperty({ description: 'Código del documento', example: '01' })
  codDoc: string

  @ApiProperty({ description: 'Establecimiento', example: '001' })
  estab: string

  @ApiProperty({ description: 'Punto de emisión', example: '200' })
  ptoEmi: string

  @ApiProperty({ description: 'Secuencial', example: '000000008' })
  secuencial: string

  @ApiProperty({ description: 'Dirección matriz', example: 'Ambato' })
  dirMatriz: string
}

export class TotalImpuestoDto {
  @ApiProperty({ description: 'Código del impuesto', example: '2' })
  codigo: string

  @ApiProperty({ description: 'Código de porcentaje', example: '0' })
  codigoPorcentaje: string

  @ApiProperty({ description: 'Descuento adicional', example: '0.00' })
  descuentoAdicional: string

  @ApiProperty({ description: 'Base imponible', example: '20.00' })
  baseImponible: string

  @ApiProperty({ description: 'Valor', example: '0.00' })
  valor: string
}

export class TotalConImpuestosDto {
  @ApiProperty({ type: [TotalImpuestoDto] })
  totalImpuesto: TotalImpuestoDto[]
}

export class PagoDto {
  @ApiProperty({ description: 'Forma de pago', example: '01' })
  formaPago: string

  @ApiProperty({ description: 'Total', example: '20.00' })
  total: string
}

export class PagosDto {
  @ApiProperty({ type: [PagoDto] })
  pago: PagoDto[]
}

export class ImpuestoDetalleDto {
  @ApiProperty({ description: 'Código del impuesto', example: '2' })
  codigo: string

  @ApiProperty({ description: 'Código de porcentaje', example: '0' })
  codigoPorcentaje: string

  @ApiProperty({ description: 'Tarifa', example: '0.00' })
  tarifa: string

  @ApiProperty({ description: 'Base imponible', example: '20.00' })
  baseImponible: string

  @ApiProperty({ description: 'Valor', example: '0.00' })
  valor: string
}

export class ImpuestosDetalleDto {
  @ApiProperty({ type: [ImpuestoDetalleDto] })
  impuesto: ImpuestoDetalleDto[]
}

export class DetalleDto {
  @ApiProperty({ description: 'Código principal', example: 'OTR001' })
  codigoPrincipal: string

  @ApiProperty({ description: 'Código auxiliar', example: 'OTR001' })
  codigoAuxiliar: string

  @ApiProperty({ description: 'Descripción', example: 'OTROS' })
  descripcion: string

  @ApiProperty({ description: 'Cantidad', example: '1.00' })
  cantidad: string

  @ApiProperty({ description: 'Precio unitario', example: '20.00' })
  precioUnitario: string

  @ApiProperty({ description: 'Descuento', example: '0.00' })
  descuento: string

  @ApiProperty({ description: 'Precio total sin impuesto', example: '20.00' })
  precioTotalSinImpuesto: string

  @ApiProperty({ type: ImpuestosDetalleDto })
  impuestos: ImpuestosDetalleDto
}

export class DetallesDto {
  @ApiProperty({ type: [DetalleDto] })
  detalle: DetalleDto[]
}

export class CampoAdicionalDto {
  @ApiProperty()
  _nombre: string

  @ApiProperty()
  __text?: string
}

export class InfoAdicionalDto {
  @ApiProperty({ type: [CampoAdicionalDto] })
  campoAdicional: CampoAdicionalDto[]
}

export class InfoFacturaDto {
  @ApiProperty({ description: 'Fecha de emisión', example: '26/12/2024' })
  fechaEmision: string

  @ApiProperty({
    description: 'Dirección del establecimiento',
    example: 'Nueva Ambato',
  })
  dirEstablecimiento: string

  @ApiProperty({ description: 'Obligado a llevar contabilidad', example: 'NO' })
  obligadoContabilidad: string

  @ApiProperty({
    description: 'Tipo de identificación del comprador',
    example: '05',
  })
  tipoIdentificacionComprador: string

  @ApiProperty({
    description: 'Guía de remisión',
    example: '000-000-000009999',
  })
  guiaRemision: string

  @ApiProperty({
    description: 'Razón social del comprador',
    example: 'Efrain Caina',
  })
  razonSocialComprador: string

  @ApiProperty({
    description: 'Identificación del comprador',
    example: '1801808112',
  })
  identificacionComprador: string

  @ApiProperty({ description: 'Dirección del comprador', example: 'Ambato' })
  direccionComprador: string

  @ApiProperty({ description: 'Total sin impuestos', example: '20.00' })
  totalSinImpuestos: string

  @ApiProperty({ description: 'Total descuento', example: '0.00' })
  totalDescuento: string

  @ApiProperty({ type: TotalConImpuestosDto })
  totalConImpuestos: TotalConImpuestosDto

  @ApiProperty({ description: 'Importe total', example: '20.00' })
  importeTotal: string

  @ApiProperty({ description: 'Moneda', example: 'dolar' })
  moneda: string

  @ApiProperty({ type: PagosDto })
  pagos: PagosDto
}

export class FacturaXmlDto {
  @ApiProperty({ type: TaxInfoDto })
  infoTributaria: Partial<TaxInfoDto>

  @ApiProperty({ type: InvoiceInfoDto })
  infoFactura: Partial<InvoiceInfoDto>

  @ApiProperty({ type: DetailsDto })
  detalles: Partial<DetailsDto>

  @ApiProperty({ type: AdditionalDetailDto })
  infoAdicional: Partial<AdditionalDetailDto>
}
