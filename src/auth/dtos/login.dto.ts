import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { IsEcuadorianIdentityCard } from 'src/common/decorators/ecuadorian-id.decorator'

export class LoginUserDto {
  @ApiProperty({
    description: 'Cédula del usuario(es requerido)',
    example: '1812345678',
  })
  @IsEcuadorianIdentityCard()
  @IsNotEmpty()
  cedula: string

  @ApiProperty({
    description: 'Contraseña del usuario(es requerido)',
    example: 'usuario123',
  })
  @IsNotEmpty()
  password: string
}
