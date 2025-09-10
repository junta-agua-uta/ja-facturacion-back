import { PartialType } from '@nestjs/swagger'
import { CrearSucursalDto } from './crearSucursal.dto'
import { ApiProperty } from '@nestjs/swagger'

export class EditarSucursalDto extends PartialType(CrearSucursalDto) {
  @ApiProperty({
    description: 'ID de la sucursal a editar',
    example: 1,
    required: true,
  })
  id?: number
}
