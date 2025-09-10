import { ApiProperty } from '@nestjs/swagger'
import { ROL } from '@prisma/client'
import { IsEmail, IsNotEmpty } from 'class-validator'
import { IsEcuadorianIdentityCard } from 'src/common/decorators/ecuadorian-id.decorator'

export class RegisterAuthDto {
  @ApiProperty({
    description: 'Cedula del usuario(es requerido)',
    example: '1812345678',
  })
  @IsEcuadorianIdentityCard()
  @IsNotEmpty()
  cedula: string

  @ApiProperty({
    description: 'nombre del usuario(es requerido)',
    example: 'carlos',
  })
  @IsNotEmpty()
  nombre: string

  @ApiProperty({
    description: 'apellido del usuario(es requerido)',
    example: 'perez',
  })
  @IsNotEmpty()
  apellido: string

  @ApiProperty({
    description: 'correo del usuario(es requerido)',
    example: 'jperez@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  correo: string

  @ApiProperty({
    description: 'contraseña del usuario(es requerido)',
    example: 'usuario123',
  })
  @IsNotEmpty()
  password: string

  hash?: string
  salt?: string

  @ApiProperty({
    description: 'rol del usuario(no es requerido)',
    example: 'CONTADOR',
    required: false,
  })
  rol?: ROL
}
