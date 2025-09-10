import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import { TIPO_PAGO } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class DetallesFacturaDto {
  @ApiProperty({
    description: 'Descripción del detalle de la factura',
    example: 'Tarifa Básica Diciembre',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string

  @ApiProperty({
    description: 'ID de la razón de la factura',
    example: 1,
    required: true,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  idRazon: number

  @ApiProperty({
    description: 'Cantidad del detalle de la factura',
    example: 1,
    required: true,
    type: Number,
  })
  @IsInt()
  @IsOptional()
  cantidad?: number

  @ApiProperty({
    description: 'Subtotal del detalle de la factura',
    example: 100.5,
    required: true,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  subtotal: number

  @ApiProperty({
    description: 'Descuento del detalle de la factura',
    example: 0.0,
    required: true,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  descuento?: number

  @ApiProperty({
    description: 'Precio del IVA del detalle de la factura',
    example: 0.0,
    required: true,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  precioIva?: number
}

export class CrearFacturaDto {
  @ApiProperty({
    description: 'ID de la sucursal donde se emite la factura',
    example: 1,
    required: true,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  idSucursal: number

  @ApiProperty({
    description: 'ID del usuario que emite la factura',
    example: 5,
    required: true,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  idUsuario: number

  @ApiProperty({
    description: 'ID del cliente al que se le emite la factura',
    example: 9,
    required: true,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  idCliente: number

  @ApiProperty({
    description: 'ID del medidor asociado a la factura',
    example: 1,
    required: true,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  idMedidor: number

  @ApiProperty({
    description: 'Tipo de pago de la factura',
    example: 'EFECTIVO',
    required: true,
    enum: TIPO_PAGO,
  })
  @IsEnum(TIPO_PAGO)
  @IsNotEmpty()
  tipoPago: TIPO_PAGO

  @ApiProperty({
    description: 'Valor de la factura sin impuestos',
    example: 100.5,
    required: true,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  valorSinImpuesto: number

  @ApiProperty({
    description: 'Valor del IVA',
    example: 0,
    required: true,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  iva?: number

  @ApiProperty({
    description: 'Detalles de la factura',
    required: true,
    type: [DetallesFacturaDto],
  })
  @Type(() => DetallesFacturaDto)
  detalles: DetallesFacturaDto[]
}
