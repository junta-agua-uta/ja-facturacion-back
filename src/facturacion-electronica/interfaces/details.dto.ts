import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AdditionalDetailDto {
  @ApiProperty({
    description: 'Nombre del detalle adicional',
    example: 'Color',
  })
  ['@nombre']: string;

  @ApiProperty({ description: 'Valor del detalle adicional', example: 'Azul' })
  ['@valor']: string
}

export class TaxDto {
  @ApiProperty({ description: 'Código del impuesto', example: '2' })
  codigo: string

  @ApiProperty({ description: 'Código porcentaje', example: '2' })
  codigoPorcentaje: string

  @ApiProperty({ description: 'Tarifa', example: '12' })
  tarifa: string

  @ApiProperty({ description: 'Base imponible', example: '100.00' })
  baseImponible: string

  @ApiProperty({ description: 'Valor del impuesto', example: '12.00' })
  valor: string
}
export class TaxesDto {
  @ApiProperty({
    description: 'Lista de impuestos',
    type: [TaxDto],
  })
  impuesto: TaxDto[]
}
export class AdditionalDetailsDto {
  @ApiProperty({
    description: 'Lista de detalles adicionales',
    type: [AdditionalDetailDto],
  })
  detAdicional: AdditionalDetailDto[]
}

export class DetailDto {
  @ApiProperty({ description: 'Código principal', example: 'A001' })
  codigoPrincipal: string

  @ApiProperty({ description: 'Código auxiliar', example: 'B001' })
  codigoAuxiliar: string

  @ApiProperty({ description: 'Descripción', example: 'Producto X' })
  descripcion: string

  @ApiPropertyOptional({ description: 'Unidad de medida', example: 'Unidad' })
  unidadMedida?: string

  @ApiProperty({ description: 'Cantidad', example: '2' })
  cantidad: string

  @ApiProperty({ description: 'Precio unitario', example: '50.00' })
  precioUnitario: string

  @ApiPropertyOptional({ description: 'Precio sin subsidio', example: '55.00' })
  precioSinSubsidio?: string

  @ApiProperty({ description: 'Descuento', example: '0.00' })
  descuento: string

  @ApiProperty({ description: 'Precio total sin impuesto', example: '100.00' })
  precioTotalSinImpuesto: string

  @ApiPropertyOptional({
    description: 'Detalles adicionales',
    type: AdditionalDetailsDto,
  })
  detallesAdicionales?: AdditionalDetailsDto

  @ApiProperty({
    description: 'Impuestos',
    type: TaxesDto,
  })
  impuestos: TaxesDto
}

export class DetailsDto {
  @ApiProperty({
    description: 'Lista de detalles',
    type: [DetailDto],
  })
  detalle: DetailDto[]
}
