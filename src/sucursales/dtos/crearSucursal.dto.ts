import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CrearSucursalDto {
  @ApiProperty({
    description: 'Nombre de la sucursal (es requerido)',
    example: 'Sucursal Prueba',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string

  @ApiProperty({
    description: 'Ubicacion de la sucursal (es requerido)',
    example: 'Ambato',
  })
  @IsString()
  @IsNotEmpty()
  ubicacion: string

  @ApiProperty({
    description: 'Punto de emision de la sucursal (es requerido)',
    example: '100',
  })
  @IsString()
  @IsNotEmpty()
  punto_emision: string
}
