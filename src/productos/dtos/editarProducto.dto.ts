import { PartialType } from '@nestjs/swagger'
import { CrearProductoDto } from './crearProducto.dto'
import { ApiProperty } from '@nestjs/swagger'

export class EditarProductoDto extends PartialType(CrearProductoDto) {
  @ApiProperty({
    description: 'ID del producto a editar',
    example: 1,
  })
  id: number
}
