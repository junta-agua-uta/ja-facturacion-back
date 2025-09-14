import {
  IsString,
  IsOptional,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CrearConceptoDto {
  @ApiProperty({
    description:
      'Código único del concepto (requerido). Recomendado: mayúsculas y números.',
    example: 'EXCEDENTE',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  @MaxLength(32, { message: 'El código no debe superar 32 caracteres' })
  @Matches(/^[A-Z0-9_ -]+$/, {
    message:
      'El código solo puede contener letras mayúsculas, números, guion y guion bajo',
  })
  codigo: string

  @ApiPropertyOptional({
    description: 'Código interno del concepto (opcional)',
    example: 'EXC001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32, { message: 'El código interno no debe superar 32 caracteres' })
  codInterno?: string

  @ApiProperty({
    description: 'Descripción del concepto (requerido)',
    example: 'Excedente',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'La descripción no debe superar 255 caracteres' })
  desc: string

  @ApiPropertyOptional({
    description: 'Precio base del concepto (opcional)',
    example: 2.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El precio base no puede ser negativo' })
  precioBase?: number

  @ApiPropertyOptional({
    description: 'Indica si el concepto requiere mes (opcional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereMes?: boolean
}
