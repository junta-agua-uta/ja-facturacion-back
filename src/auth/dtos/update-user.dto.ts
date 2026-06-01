// dtos/update-user.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'
import { IsEcuadorianIdentityCard } from 'src/common/decorators/ecuadorian-id.decorator'

export class UpdateUserDto {
  @ApiProperty({
    description: 'Cédula del usuario (opcional)',
    example: '1812345678',
    required: false,
  })
  @IsOptional()
  @IsEcuadorianIdentityCard()
  @IsString()
  cedula?: string

  @ApiProperty({
    description: 'Nombre del usuario (opcional)',
    example: 'Carlos',
    required: false,
  })
  @IsOptional()
  @IsString()
  nombre?: string

  @ApiProperty({
    description: 'Apellido del usuario (opcional)',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  apellido?: string

  @ApiProperty({
    description: 'Correo electrónico del usuario (opcional)',
    example: 'cperez@gmail.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  correo?: string

  @ApiProperty({
    description: 'Nueva contraseña del usuario (opcional, mínimo 6 caracteres)',
    example: 'nuevaContraseña123',
    required: false,
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'miContraseñaActual123',
    required: true,
  })
  @IsString()
  currentPassword: string

  @ApiProperty({
    description: 'Nueva contraseña del usuario (mínimo 6 caracteres)',
    example: 'miNuevaContraseña456',
    required: true,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string

  hash?: string
  salt?: string
}
