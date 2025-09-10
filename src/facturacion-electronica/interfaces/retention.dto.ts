import { ApiProperty } from '@nestjs/swagger'

export class RetentionDto {
  @ApiProperty({ description: 'Código de la retención', example: '1' })
  codigo: string

  @ApiProperty({
    description: 'Código porcentaje de la retención',
    example: '2',
  })
  codigoPorcentaje: string

  @ApiProperty({ description: 'Tarifa de la retención', example: '10' })
  tarifa: string

  @ApiProperty({ description: 'Valor de la retención', example: '5.00' })
  valor: string
}

export class RetentionsDto {
  @ApiProperty({
    description: 'Lista de retenciones',
    type: [RetentionDto],
  })
  retencion: RetentionDto[]
}
