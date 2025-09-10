import { PartialType } from '@nestjs/swagger'
import { CrearClienteDto } from './crearCliente.dto'
import { ApiProperty } from '@nestjs/swagger'

export class EditarClienteDto extends PartialType(CrearClienteDto) {
  @ApiProperty({
    description: 'ID del cliente a editar',
    example: 1,
  })
  id: number
}
