import { IsInt, IsOptional, Min, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ObtenerProductosDto {
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

  @ApiPropertyOptional({
    description:
      'Texto de búsqueda opcional para filtrar por código o descripción del producto',
    example: 'VERTI',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string
}
