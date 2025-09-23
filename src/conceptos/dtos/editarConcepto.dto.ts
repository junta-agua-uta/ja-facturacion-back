import { PartialType } from '@nestjs/swagger'
import { CrearConceptoDto } from './crearConcepto.dto'
import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class EditarConceptoDto extends PartialType(CrearConceptoDto) {
  @ApiProperty({
    description: 'ID del concepto a editar (si lo envías en el body)',
    example: '1',
  })
  @IsString()
  id: string
}
