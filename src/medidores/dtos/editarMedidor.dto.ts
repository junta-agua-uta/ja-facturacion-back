// filepath: c:\Users\edder\OneDrive\Escritorio\Junta Medidores\JuntaAgua\src\medidores\dtos\editarMedidor.dto.ts
import { PartialType } from '@nestjs/swagger'
import { CrearMedidorDto } from './crearMedidor.dto'
import { ApiProperty } from '@nestjs/swagger'

export class EditarMedidorDto extends PartialType(CrearMedidorDto) {
  @ApiProperty({
    description: 'ID del medidor a editar',
    example: 1,
  })
  id: number
}
