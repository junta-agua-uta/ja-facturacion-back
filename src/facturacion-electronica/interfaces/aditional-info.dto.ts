import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AdditionalFieldDto {
  @ApiProperty({
    name: '@nombre',
    description: 'Nombre del campo adicional',
    example: 'nombre4',
  })
  @IsString()
  @IsNotEmpty()
  ['@nombre']: string;

  @ApiProperty({
    name: '#',
    description: 'Valor del campo adicional',
    example: 'campoAdicional0',
  })
  @IsString()
  @IsNotEmpty()
  ['#']: string
}

export class AdditionalInfoDto {
  @ApiProperty({
    description: 'Lista de campos adicionales',
    type: [AdditionalFieldDto],
  })
  campoAdicional: AdditionalFieldDto[]
}
