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
import { Transform, Type } from 'class-transformer'

export class CrearConceptoDto {
  @ApiProperty({
    description:
      'Código único del concepto (requerido). Se normaliza a MAYÚSCULAS.',
    example: 'EXCEDENTE',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  @MaxLength(32, { message: 'El código no debe superar 32 caracteres' })
  @Matches(/^[A-Za-z0-9_ -]+$/, {
    message:
      'El código solo puede contener letras, números, guion y guion bajo',
  })
  codigo: string

  @ApiPropertyOptional({
    description:
      'Código interno del concepto (opcional). Se normaliza a MAYÚSCULAS.',
    example: 'EXC001',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MaxLength(32, { message: 'El código interno no debe superar 32 caracteres' })
  @Matches(/^[A-Za-z0-9_ -]+$/, {
    message:
      'El código interno solo puede contener letras, números, guion y guion bajo',
  })
  codInterno?: string

  @ApiProperty({
    description: 'Descripción del concepto (requerido)',
    example: 'Excedente',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El precio base no puede ser negativo' })
  precioBase?: number

  @ApiPropertyOptional({
    description: 'Indica si el concepto requiere mes (opcional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  requiereMes?: boolean
}
