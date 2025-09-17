import { ApiProperty } from '@nestjs/swagger'

export class InfoTributariaLiquidacionDto {
  @ApiProperty({ description: 'Ambiente: 1 = Pruebas, 2 = Producción', example: '1' })
  ambiente: '1' | '2'

  @ApiProperty({ description: 'Tipo de emisión: 1 = Normal', example: '1' })
  tipoEmision: '1'

  @ApiProperty({ description: 'Razón social del emisor', example: 'MI EMPRESA S.A.' })
  razonSocial: string

  @ApiProperty({ description: 'Nombre comercial del emisor', example: 'MI EMPRESA' })
  nombreComercial: string

  @ApiProperty({ description: 'RUC del emisor', example: '1790012345001' })
  ruc: string

  @ApiProperty({ description: 'Código del documento: 03 = Liquidación de Compra', example: '03' })
  codDoc: '03'

  @ApiProperty({ description: 'Código del establecimiento', example: '001' })
  estab: string

  @ApiProperty({ description: 'Punto de emisión', example: '001' })
  ptoEmi: string

  @ApiProperty({ description: 'Secuencial del documento', example: '000000123' })
  secuencial: string

  @ApiProperty({ description: 'Dirección matriz', example: 'Av. Siempre Viva 123' })
  dirMatriz: string
}

export class InfoLiquidacionCompraDto {
  @ApiProperty({ description: 'Fecha de emisión', example: '13/09/2025' })
  fechaEmision: string

  @ApiProperty({ description: 'Dirección del establecimiento', example: 'Av. Siempre Viva 123' })
  dirEstablecimiento: string

  @ApiProperty({ description: 'Tipo de identificación del proveedor (04=RUC, 05=CEDULA)', example: '05' })
  tipoIdentificacionProveedor: string

  @ApiProperty({ description: 'Razón social del proveedor', example: 'Proveedor de Prueba' })
  razonSocialProveedor: string

  @ApiProperty({ description: 'Identificación del proveedor', example: '0102030405' })
  identificacionProveedor: string

  @ApiProperty({ description: 'Total sin impuestos', example: 100.00 })
  totalSinImpuestos: number

  @ApiProperty({ description: 'Total descuento', example: 0.00 })
  totalDescuento: number

  @ApiProperty({ description: 'Importe total', example: 112.00 })
  importeTotal: number

  @ApiProperty({ description: 'Moneda', example: 'DOLAR' })
  moneda: string
}

export class DetalleLiquidacionDto {
  @ApiProperty({ description: 'Código principal del producto/servicio', example: 'PROD001' })
  codigoPrincipal: string

  @ApiProperty({ description: 'Descripción del producto/servicio', example: 'Producto de ejemplo' })
  descripcion: string

  @ApiProperty({ description: 'Cantidad', example: 10.00 })
  cantidad: number

  @ApiProperty({ description: 'Precio unitario', example: 10.00 })
  precioUnitario: number

  @ApiProperty({ description: 'Descuento', example: 0.00 })
  descuento: number

  @ApiProperty({ description: 'Precio total sin impuesto', example: 100.00 })
  precioTotalSinImpuesto: number

  @ApiProperty({ description: 'Código de impuesto', example: '2' })
  codigoImpuesto: string

  @ApiProperty({ description: 'Código de porcentaje de impuesto (2=12%)', example: '2' })
  codigoPorcentajeImpuesto: string

  @ApiProperty({ description: 'Tarifa de impuesto', example: 12.00 })
  tarifaImpuesto: number

  @ApiProperty({ description: 'Base imponible', example: 100.00 })
  baseImponible: number

  @ApiProperty({ description: 'Valor del impuesto', example: 12.00 })
  valorImpuesto: number
}

export class TotalImpuestoLiquidacionDto {
  @ApiProperty({ description: 'Código de impuesto', example: '2' })
  codigo: string

  @ApiProperty({ description: 'Código de porcentaje de impuesto (2=12%)', example: '2' })
  codigoPorcentaje: string

  @ApiProperty({ description: 'Base imponible', example: 100.00 })
  baseImponible: number

  @ApiProperty({ description: 'Valor del impuesto', example: 12.00 })
  valor: number
}

export class TotalConImpuestosLiquidacionDto {
  @ApiProperty({ description: 'Total de impuestos', type: [TotalImpuestoLiquidacionDto] })
  totalImpuesto: TotalImpuestoLiquidacionDto[]
}

export class InfoAdicionalLiquidacionDto {
  @ApiProperty({ description: 'Campos adicionales', example: [
    { '@nombre': 'Email', '#': 'proveedor@correo.com' },
    { '@nombre': 'Telefono', '#': '0999999999' }
  ] })
  campoAdicional: {
    '@nombre': string
    '#': string
  }[]
}

export class LiquidacionCompraDto {
  @ApiProperty({ description: 'ID del comprobante', example: 'comprobante' })
  '@id': string

  @ApiProperty({ description: 'Versión del comprobante', example: '1.1.0' })
  '@version': string

  @ApiProperty({ description: 'Información tributaria', type: InfoTributariaLiquidacionDto })
  infoTributaria: InfoTributariaLiquidacionDto

  @ApiProperty({ description: 'Información de la liquidación de compra', type: InfoLiquidacionCompraDto })
  infoLiquidacionCompra: InfoLiquidacionCompraDto

  @ApiProperty({ description: 'Total con impuestos', type: TotalConImpuestosLiquidacionDto })
  totalConImpuestos: TotalConImpuestosLiquidacionDto

  @ApiProperty({ description: 'Detalles de la liquidación', type: [DetalleLiquidacionDto] })
  detalles: DetalleLiquidacionDto[]

  @ApiProperty({ description: 'Información adicional', type: InfoAdicionalLiquidacionDto })
  infoAdicional: InfoAdicionalLiquidacionDto
}

export class LiquidacionCompraInputDto {
  @ApiProperty({ description: 'Información tributaria', type: InfoTributariaLiquidacionDto })
  infoTributaria: InfoTributariaLiquidacionDto

  @ApiProperty({ description: 'Información de la liquidación de compra', type: InfoLiquidacionCompraDto })
  infoLiquidacionCompra: InfoLiquidacionCompraDto

  @ApiProperty({ description: 'Detalles de la liquidación', type: [DetalleLiquidacionDto] })
  detalles: DetalleLiquidacionDto[]
}
