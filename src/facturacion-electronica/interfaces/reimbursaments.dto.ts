import { ApiProperty } from '@nestjs/swagger'

export class TaxDetailDto {
  @ApiProperty({ description: 'Código del impuesto', example: '2' })
  codigo: string

  @ApiProperty({ description: 'Código porcentaje', example: '2' })
  codigoPorcentaje: string

  @ApiProperty({ description: 'Tarifa', example: '12' })
  tarifa: string

  @ApiProperty({
    description: 'Base imponible de reembolso',
    example: '100.00',
  })
  baseImponibleReembolso: string

  @ApiProperty({ description: 'Impuesto de reembolso', example: '12.00' })
  impuestoReembolso: string
}

export class TaxDetailsDto {
  @ApiProperty({
    description: 'Lista de detalles de impuestos',
    type: [TaxDetailDto],
  })
  detalleImpuesto: TaxDetailDto[]
}

export class ReimbursementCompensationDto {
  @ApiProperty({ description: 'Código de compensación', example: '001' })
  codigo: string

  @ApiProperty({ description: 'Tarifa de compensación', example: '10' })
  tarifa: string

  @ApiProperty({ description: 'Valor de compensación', example: '5.00' })
  valor: string
}

export class ReimbursementCompensationsDto {
  @ApiProperty({
    description: 'Lista de compensaciones de reembolso',
    type: [ReimbursementCompensationDto],
  })
  compensacionesReembolso: ReimbursementCompensationDto[]
}

export class ReimbursementDetailDto {
  @ApiProperty({
    description: 'Tipo de identificación del proveedor de reembolso',
    example: '04',
  })
  tipoIdentificacionProveedorReembolso: string

  @ApiProperty({
    description: 'Identificación del proveedor de reembolso',
    example: '1790012345001',
  })
  identificacionProveedorReembolso: string

  @ApiProperty({
    description: 'Código de país de pago al proveedor de reembolso',
    example: 'ECU',
  })
  codPaisPagoProveedorReembolso: string

  @ApiProperty({
    description: 'Tipo de proveedor de reembolso',
    example: 'NACIONAL',
  })
  tipoProveedorReembolso: string

  @ApiProperty({
    description: 'Código del documento de reembolso',
    example: '01',
  })
  codDocReembolso: string

  @ApiProperty({
    description: 'Establecimiento del documento de reembolso',
    example: '001',
  })
  estabDocReembolso: string

  @ApiProperty({
    description: 'Punto de emisión del documento de reembolso',
    example: '002',
  })
  ptoEmiDocReembolso: string

  @ApiProperty({
    description: 'Secuencial del documento de reembolso',
    example: '000000123',
  })
  secuencialDocReembolso: string

  @ApiProperty({
    description: 'Fecha de emisión del documento de reembolso',
    example: '2024-05-20',
  })
  fechaEmisionDocReembolso: string

  @ApiProperty({
    description: 'Número de autorización del documento de reembolso',
    example: '1234567890',
  })
  numeroautorizacionDocReemb: string

  @ApiProperty({ description: 'Detalle de impuestos', type: TaxDetailsDto })
  detalleImpuestos: TaxDetailsDto

  @ApiProperty({
    description: 'Compensaciones de reembolso',
    type: ReimbursementCompensationsDto,
  })
  compensacionesReembolso: ReimbursementCompensationsDto
}

export class ReimbursementsDto {
  @ApiProperty({
    description: 'Lista de detalles de reembolso',
    type: [ReimbursementDetailDto],
  })
  reembolsoDetalle: ReimbursementDetailDto[]
}
