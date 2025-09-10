import { ApiProperty } from '@nestjs/swagger'

export class ThirdPartValueDto {
  @ApiProperty({ description: 'Concepto del rubro', example: 'Servicio extra' })
  concepto: string

  @ApiProperty({ description: 'Total del rubro', example: '100.00' })
  total: string
}

export class OtherThirdPartValuesDto {
  @ApiProperty({
    description: 'Lista de rubros de terceros',
    type: [ThirdPartValueDto],
  })
  rubro: ThirdPartValueDto[]
}
