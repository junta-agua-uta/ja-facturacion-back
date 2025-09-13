import {
  IsString,
  IsOptional,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CrearProductoDto {
  @ApiProperty({
    description:
      'Código único del producto (requerido). Recomendado: mayúsculas y números.',
    example: 'VER001',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  @MaxLength(32, { message: 'El código no debe superar 32 caracteres' })
  @Matches(/^[A-Z0-9-_]+$/, {
    message:
      'El código solo puede contener letras mayúsculas, números, guion y guion bajo',
  })
  codigo: string

  @ApiProperty({
    description: 'Descripción del producto (requerido)',
    example: 'Vertiente',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'La descripción no debe superar 255 caracteres' })
  descripcion: string

  @ApiPropertyOptional({
    description:
      'Estado del producto (opcional). Si no se envía, se marcará como activo (true).',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean
}
