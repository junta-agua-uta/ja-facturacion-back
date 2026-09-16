// filepath: c:\Users\edder\OneDrive\Escritorio\Junta Medidores\JuntaAgua\src\medidores\dtos\obtenerMedidores.dto.ts
import { IsInt, IsOptional, Min, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class ObtenerMedidoresDto {
  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
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
    description: 'ID del cliente para filtrar medidores',
    example: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idCliente?: number

  @ApiPropertyOptional({
    description: 'Número del medidor para búsqueda',
    example: 'MED12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  numeroMedidor?: string
}
