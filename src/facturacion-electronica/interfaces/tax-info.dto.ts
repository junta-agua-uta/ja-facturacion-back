import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TaxInfoDto {
  @ApiProperty({
    description: 'Ambiente: 1 = Pruebas, 2 = Producción',
    example: '1',
    enum: ['1', '2'],
  })
  ambiente: '1' | '2'

  @ApiProperty({
    description: 'Tipo de emisión',
    example: '1',
  })
  tipoEmision: string

  @ApiProperty({
    description: 'Razón social',
    example: 'EMPRESA S.A.',
  })
  razonSocial: string

  @ApiPropertyOptional({
    description: 'Nombre comercial',
    example: 'EMPRESA COMERCIAL',
  })
  nombreComercial?: string

  @ApiProperty({
    description: 'RUC',
    example: '1790012345001',
  })
  ruc: string

  @ApiProperty({
    description: 'Clave de acceso',
    example: '1234567890123456789012345678901234567890123456789',
  })
  claveAcceso: string

  @ApiProperty({
    description: `Código del documento:
    01: FACTURA
    03: LIQUIDACIÓN DE COMPRA DE BIENES Y PRESTACIÓN DE SERVICIOS
    04: NOTA DE CRÉDITO
    05: NOTA DE DÉBITO
    06: GUÍA DE REMISIÓN
    07: COMPROBANTE DE RETENCIÓN`,
    example: '01',
    enum: ['01', '03', '04', '05', '06', '07'],
  })
  codDoc: '01' | '03' | '04' | '05' | '06' | '07'

  @ApiProperty({
    description: 'Código del establecimiento',
    example: '001',
  })
  estab: string

  @ApiProperty({
    description: 'Punto de emisión',
    example: '002',
  })
  ptoEmi: string

  @ApiProperty({
    description: 'Secuencial',
    example: '000000123',
  })
  secuencial: string

  @ApiProperty({
    description: 'Dirección matriz',
    example: 'Av. Siempre Viva 123',
  })
  dirMatriz: string

  @ApiPropertyOptional({
    description: 'Régimen microempresas',
    example: 'CONTRIBUYENTE RÉGIMEN MICROEMPRESAS',
    enum: ['CONTRIBUYENTE RÉGIMEN MICROEMPRESAS'],
  })
  regimenMicroempresas?: 'CONTRIBUYENTE RÉGIMEN MICROEMPRESAS'

  @ApiPropertyOptional({
    description: 'Agente de retención',
    example: 'SI',
  })
  agenteRetencion?: string

  @ApiPropertyOptional({
    description: 'Contribuyente RIMPE',
    example: 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE',
    enum: [
      'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE',
      'CONTRIBUYENTE RÉGIMEN RIMPE',
    ],
  })
  contribuyenteRimpe?:
    | 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE'
    | 'CONTRIBUYENTE RÉGIMEN RIMPE'
}
