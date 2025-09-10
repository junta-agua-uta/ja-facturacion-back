import { IsInt, IsOptional, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ObtenerClientesDto {
  @ApiProperty({
    description: 'Número de página para la paginación de resultados',
    example: 1,
    required: false,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number

  @ApiProperty({
    description: 'Número de registros por página',
    example: 10,
    required: false,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number
}
