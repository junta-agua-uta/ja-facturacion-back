import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ example: 'PROD001' })
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

  @ApiProperty({ example: '2' })
  codigoImpuesto: string;

  @ApiProperty({ example: '2' })
  codigoPorcentajeImpuesto: string;

  @ApiProperty({ example: 12.00 })
  tarifaImpuesto: number;

  @ApiProperty({ example: 100.00 })
  baseImponible: number;

  @ApiProperty({ example: 12.00 })
  valorImpuesto: number;

  @ApiProperty({ example: 'AUX001', required: false })
  codigoAuxiliar?: string; // ✅ opcional

  @ApiProperty({ example: 'UN', required: false })
  unidadMedida?: string; // ✅ opcional
}

export class LiquidacionCompraInputDto {
  @ApiProperty({ type: InfoLiquidacionCompraDto })
  infoLiquidacionCompra: InfoLiquidacionCompraDto;

  @ApiProperty({ type: [DetalleLiquidacionDto] })
  detalles: DetalleLiquidacionDto[];
}
