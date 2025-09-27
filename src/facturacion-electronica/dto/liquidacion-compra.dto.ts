import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO simplificado - SOLO estos 5 campos obligatorios
export class DetalleSimplificadoDto {
  @ApiProperty({ example: 'Producto de ejemplo', description: 'Descripción del producto/servicio' })
  descripcion: string;

  @ApiProperty({ example: 10, description: 'Cantidad del producto/servicio' })
  cantidad: number;

  @ApiProperty({ example: 10.00, description: 'Precio unitario' })
  precioUnitario: number;

  @ApiProperty({ example: 0.00, description: 'Valor del descuento' })
  descuento: number;

  @ApiProperty({ example: 12.00, description: 'Valor del impuesto (IVA)' })
  valorImpuesto: number;
}

export class InfoLiquidacionCompraDto {
  @ApiProperty({ example: '13/09/2025' })
  fechaEmision: string;

  @ApiProperty({ example: 'Av. Siempre Viva 123' })
  dirEstablecimiento: string;

  @ApiProperty({ example: '05' })
  tipoIdentificacionProveedor: string;

  @ApiProperty({ example: 'Proveedor de Prueba' })
  razonSocialProveedor: string;

  @ApiProperty({ example: '0102030405' })
  identificacionProveedor: string;

  @ApiProperty({ example: 100.00 })
  totalSinImpuestos: number;

  @ApiProperty({ example: 0.00 })
  totalDescuento: number;

  @ApiProperty({ example: 112.00 })
  importeTotal: number;

  @ApiProperty({ example: 'DOLAR' })
  moneda: string;

  @ApiProperty({ example: 'Av. Proveedor 123', required: false })
  direccionProveedor?: string; // ✅ nueva propiedad opcional
}

export class DetalleLiquidacionDto {
  @ApiProperty({ example: 'PROD001', description: 'Código generado automáticamente' })
  codigoPrincipal: string;

  @ApiProperty({ example: 'Producto de ejemplo' })
  descripcion: string;

  @ApiProperty({ example: 10.00 })
  cantidad: number;

  @ApiProperty({ example: 10.00 })
  precioUnitario: number;

  @ApiProperty({ example: 0.00 })
  descuento: number;

  @ApiProperty({ example: 100.00 })
  precioTotalSinImpuesto: number;

  @ApiProperty({ example: '2', description: 'Siempre será "2" (IVA)' })
  codigoImpuesto: string;

  @ApiProperty({ example: '2', description: 'Siempre será "2"' })
  codigoPorcentajeImpuesto: string;

  @ApiProperty({ example: 12.00 })
  tarifaImpuesto: number;

  @ApiProperty({ example: 100.00 })
  baseImponible: number;

  @ApiProperty({ example: 12.00 })
  valorImpuesto: number;

  @ApiProperty({ example: 'AUX001', description: 'Código generado automáticamente' })
  codigoAuxiliar: string;

  @ApiProperty({ example: 'UNI', description: 'Siempre será "UNI"' })
  unidadMedida: string;
}

export class LiquidacionCompraInputDto {
  @ApiProperty({ type: InfoLiquidacionCompraDto })
  infoLiquidacionCompra: InfoLiquidacionCompraDto;

  @ApiProperty({ type: [DetalleLiquidacionDto] })
  detalles: DetalleLiquidacionDto[];
}

// DTO simplificado para la entrada del usuario
export class LiquidacionCompraSimplificadaDto {
  @ApiProperty({ type: InfoLiquidacionCompraDto })
  infoLiquidacionCompra: InfoLiquidacionCompraDto;

  @ApiProperty({ 
    type: [DetalleSimplificadoDto],
    description: 'Solo requiere: descripcion, cantidad, precioUnitario, descuento, valorImpuesto'
  })
  detalles: DetalleSimplificadoDto[];
}
