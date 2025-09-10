// filepath: c:\Users\edder\OneDrive\Escritorio\Junta Medidores\JuntaAgua\src\medidores\dtos\crearMedidor.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsInt, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CrearMedidorDto {
  @ApiProperty({
    description: 'Número del medidor (es requerido)',
    example: 'MED12345',
  })
  @IsString()
  @IsNotEmpty()
  numeroMedidor: string

  @ApiPropertyOptional({
    description: 'Modelo del medidor (opcional)',
    example: 'Modelo XYZ-100',
    required: false,
  })
  @IsOptional()
  @IsString()
  modelo?: string

  @ApiPropertyOptional({
    description: 'Marca del medidor (opcional)',
    example: 'Marca ABC',
    required: false,
  })
  @IsOptional()
  @IsString()
  marca?: string

  @ApiPropertyOptional({
    description: 'Ubicación del medidor (opcional)',
    example: 'Exterior de la vivienda',
    required: false,
  })
  @IsOptional()
  @IsString()
  ubicacion?: string

  @ApiProperty({
    description: 'ID del cliente al que pertenece el medidor',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  idCliente: number
}
