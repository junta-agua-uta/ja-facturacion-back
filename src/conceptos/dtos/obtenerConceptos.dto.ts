import { IsInt, IsOptional, Min, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'

export class ObtenerConceptosDto {
  @ApiProperty({
    description: 'Número de página para la paginación de resultados',
    example: 1,
    required: false,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number

  @ApiPropertyOptional({
    description:
      'Texto de búsqueda opcional para filtrar por código, código interno o descripción',
    example: 'EXCE',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string
}
