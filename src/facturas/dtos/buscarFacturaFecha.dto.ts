import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class BuscarFacturasPorFechaDto {
  @ApiProperty({
    description: 'Fecha de inicio para la búsqueda (formato: YYYY-MM-DD)',
    example: '2025-01-01',
    required: true,
  })
  @IsDateString()
  fechaInicio: string

  @ApiPropertyOptional({
    description:
      'Fecha de fin para la búsqueda (formato: YYYY-MM-DD). Si no se especifica, se usará solo la fecha de inicio.',
    example: '2025-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string

  @ApiPropertyOptional({
    description: 'Página para la paginación de resultados',
    example: 1,
    default: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Número de registros por página',
    example: 10,
    default: 10,
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10
}
