import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TotalWithTaxDto {
  @ApiProperty({
    description: 'Código del impuesto (IVA 2, ICE 3, IRBPNR 5)',
    enum: ['2', '3', '5'],
    example: '2',
  })
  codigo: '2' | '3' | '5'

  @ApiProperty({
    description: `Código porcentaje:
    IVA 0% (0), 12% (2), 14% (3), No Objeto de Impuesto (6), Exento de IVA (7), IVA diferenciado4 (8), ICE (ver tabla 18)`,
    enum: ['0', '2', '3', '4', '6', '7', '8'],
    example: '2',
  })
  codigoPorcentaje: '0' | '2' | '3' | '4' | '6' | '7' | '8'

  @ApiProperty({ description: 'Descuento adicional', example: '0.00' })
  descuentoAdicional: string

  @ApiProperty({ description: 'Base imponible', example: '100.00' })
  baseImponible: string

  @ApiPropertyOptional({ description: 'Tarifa', example: '12' })
  tarifa?: string

  @ApiProperty({ description: 'Valor', example: '12.00' })
  valor: string

  @ApiPropertyOptional({ description: 'Valor devolución IVA', example: '0.00' })
  valorDevolucionIva?: string
}

export class TotalWithTaxesDto {
  @ApiProperty({
    description: 'Lista de impuestos totales',
    type: [TotalWithTaxDto],
  })
  totalImpuesto: TotalWithTaxDto[]
}

export class CompensationDto {
  @ApiProperty({ description: 'Código de compensación', example: '001' })
  codigo: string

  @ApiProperty({ description: 'Tarifa de compensación', example: '10' })
  tarifa: string

  @ApiProperty({ description: 'Valor de compensación', example: '5.00' })
  valor: string
}

export class CompensationsDto {
  @ApiProperty({
    description: 'Lista de compensaciones',
    type: [CompensationDto],
  })
  compensacion: CompensationDto[]
}

export class PaymentDto {
  @ApiProperty({ description: 'Forma de pago', example: '01' })
  formaPago: string

  @ApiProperty({ description: 'Total del pago', example: '100.00' })
  total: string

  @ApiPropertyOptional({ description: 'Plazo', example: '30' })
  plazo?: string

  @ApiPropertyOptional({ description: 'Unidad de tiempo', example: 'días' })
  unidadTiempo?: string
}

export class PaymentsDto {
  @ApiProperty({
    description: 'Lista de pagos',
    type: [PaymentDto],
  })
  pago: PaymentDto[]
}

export class InvoiceInfoDto {
  @ApiProperty({ description: 'Fecha de emisión', example: '2024-05-20' })
  fechaEmision: string

  @ApiProperty({
    description: 'Dirección del establecimiento',
    example: 'Av. Siempre Viva 123',
  })
  dirEstablecimiento: string

  @ApiPropertyOptional({
    description: 'Contribuyente especial',
    example: '1234',
  })
  contribuyenteEspecial?: string

  @ApiProperty({
    description: 'Obligado a llevar contabilidad',
    enum: ['SI', 'NO'],
    example: 'SI',
  })
  obligadoContabilidad: 'SI' | 'NO'

  @ApiPropertyOptional({
    description: 'Comercio exterior',
    example: 'EXPORTACIÓN',
  })
  comercioExterior?: string

  @ApiPropertyOptional({
    description: 'IncoTerm de la factura',
    example: 'FOB',
  })
  incoTermFactura?: string

  @ApiPropertyOptional({
    description: 'Lugar IncoTerm',
    example: 'Puerto Quito',
  })
  lugarIncoTerm?: string

  @ApiPropertyOptional({ description: 'País de origen', example: 'ECU' })
  paisOrigen?: string

  @ApiPropertyOptional({
    description: 'Puerto de embarque',
    example: 'Guayaquil',
  })
  puertoEmbarque?: string

  @ApiPropertyOptional({ description: 'Puerto de destino', example: 'Callao' })
  puertoDestino?: string

  @ApiPropertyOptional({ description: 'País de destino', example: 'PER' })
  paisDestino?: string

  @ApiPropertyOptional({ description: 'País de adquisición', example: 'ECU' })
  paisAdquisicion?: string

  @ApiProperty({
    description: `Tipo de identificación del comprador:
    RUC 04, CÉDULA 05, PASAPORTE 06, VENTA A CONSUMIDOR FINAL 07, IDENTIFICACIÓN DEL EXTERIOR 08`,
    enum: ['04', '05', '06', '07', '08'],
    example: '04',
  })
  tipoIdentificacionComprador: '04' | '05' | '06' | '07' | '08'

  @ApiPropertyOptional({
    description: 'Guía de remisión',
    example: '001-002-000000123',
  })
  guiaRemision?: string

  @ApiProperty({
    description: 'Razón social del comprador',
    example: 'Juan Pérez',
  })
  razonSocialComprador: string

  @ApiProperty({
    description: 'Identificación del comprador',
    example: '1790012345001',
  })
  identificacionComprador: string

  @ApiProperty({
    description: 'Dirección del comprador',
    example: 'Calle Falsa 456',
  })
  direccionComprador: string

  @ApiProperty({ description: 'Total sin impuestos', example: '100.00' })
  totalSinImpuestos: string

  @ApiPropertyOptional({ description: 'Total subsidio', example: '0.00' })
  totalSubsidio?: string

  @ApiPropertyOptional({
    description: 'IncoTerm total sin impuestos',
    example: '100.00',
  })
  incoTermTotalSinImpuestos?: string

  @ApiProperty({ description: 'Total descuento', example: '5.00' })
  totalDescuento: string

  @ApiPropertyOptional({
    description: 'Código de documento de reembolso',
    example: '01',
  })
  codDocReembolso?: string

  @ApiPropertyOptional({
    description: 'Total comprobantes de reembolso',
    example: '1',
  })
  totalComprobantesReembolso?: string

  @ApiPropertyOptional({
    description: 'Total base imponible de reembolso',
    example: '100.00',
  })
  totalBaseImponibleReembolso?: string

  @ApiPropertyOptional({
    description: 'Total impuesto de reembolso',
    example: '12.00',
  })
  totalImpuestoReembolso?: string

  @ApiProperty({
    description: 'Totales con impuestos',
    type: TotalWithTaxesDto,
  })
  totalConImpuestos: TotalWithTaxesDto

  @ApiPropertyOptional({
    description: 'Compensaciones',
    type: CompensationsDto,
  })
  compensaciones?: CompensationsDto

  @ApiPropertyOptional({ description: 'Propina', example: '0.00' })
  propina?: string

  @ApiPropertyOptional({ description: 'Flete internacional', example: '0.00' })
  fleteInternacional?: string

  @ApiPropertyOptional({ description: 'Seguro internacional', example: '0.00' })
  seguroInternacional?: string

  @ApiPropertyOptional({ description: 'Gastos aduaneros', example: '0.00' })
  gastosAduaneros?: string

  @ApiPropertyOptional({
    description: 'Gastos de transporte otros',
    example: '0.00',
  })
  gastosTransporteOtros?: string

  @ApiProperty({ description: 'Importe total', example: '112.00' })
  importeTotal: string

  @ApiProperty({ description: 'Moneda', example: 'USD' })
  moneda: string

  @ApiPropertyOptional({ description: 'Placa', example: 'ABC-1234' })
  placa?: string

  @ApiProperty({
    description: 'Pagos',
    type: PaymentsDto,
  })
  pagos: PaymentsDto

  @ApiPropertyOptional({ description: 'Valor retenido IVA', example: '0.00' })
  valorRetIva?: string

  @ApiPropertyOptional({ description: 'Valor retenido renta', example: '0.00' })
  valorRetRenta?: string
}
