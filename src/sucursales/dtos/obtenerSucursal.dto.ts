import { ApiProperty } from '@nestjs/swagger'

export class ObtenerSucursalDto {
  @ApiProperty({
    description: 'ID único de la sucursal',
    example: 1,
    type: Number,
  })
  id: number

  @ApiProperty({
    description: 'Nombre de la sucursal',
    example: 'Sucursal Central',
  })
  nombre: string

  @ApiProperty({
    description: 'Ubicación física de la sucursal',
    example: 'Av. Principal 123, Ambato',
  })
  ubicacion: string

  @ApiProperty({
    description: 'Código del punto de emisión para facturación',
    example: '001',
  })
  punto_emision: string
}
