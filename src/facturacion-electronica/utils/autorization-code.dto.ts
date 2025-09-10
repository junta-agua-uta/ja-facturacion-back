import { ApiProperty } from '@nestjs/swagger'

export class AutorizationCodeDto {
  @ApiProperty({
    description: 'Fecha de autorización (es requerido)',
    example: '2023-10-01',
  })
  date: Date

  @ApiProperty({
    description: `Código del documento (es requerido):
    01: FACTURA
    03: LIQUIDACIÓN DE COMPRA DE BIENES Y PRESTACIÓN DE SERVICIOS
    04: NOTA DE CRÉDITO
    05: NOTA DE DÉBITO
    06: GUÍA DE REMISIÓN
    07: COMPROBANTE DE RETENCIÓN`,
    example: '01',
  })
  codDoc: '01' | '03' | '04' | '05' | '06' | '07'

  @ApiProperty({
    description: 'RUC del emisor (es requerido)',
    example: '1790012345001',
  })
  ruc: string

  @ApiProperty({
    description: 'Ambiente: 1 = Pruebas, 2 = Producción (es requerido)',
    example: '1',
  })
  environment: '1' | '2'

  @ApiProperty({
    description: 'Código del establecimiento (es requerido)',
    example: '001',
  })
  establishment: string

  @ApiProperty({
    description: 'Punto de emisión (es requerido)',
    example: '002',
  })
  emissionPoint: string

  @ApiProperty({
    description: 'Secuencial del documento (es requerido)',
    example: '000000123',
  })
  sequential: string
}
