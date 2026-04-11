import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, ArrayMinSize, Min } from 'class-validator';

export class CreateDetalleAsientoDto {
	@ApiProperty({ example: 4, description: 'ID de la cuenta contable (esDetalle obligatoriamente true)' })
	@IsInt()
	@IsNotEmpty()
	cuentaId: number;

	@ApiProperty({ example: 150.00, description: 'Carga al Debe' })
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	debe: number;

	@ApiProperty({ example: 0, description: 'Abono al Haber' })
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	haber: number;

	@ApiProperty({ required: false, example: 'Factura 123' })
	@IsOptional()
	@IsString()
	referencia?: string;

	@ApiProperty({ required: false, example: 'Cargo' })
	@IsOptional()
	@IsString()
	descta?: string;
}

export class CreateAsientoDto {
	@ApiProperty({ example: '2026-04-10T12:00:00Z', description: 'Fecha del asiento contable' })
	@IsDateString()
	@IsNotEmpty()
	fecha: string;

	@ApiProperty({ example: 'Registro de ventas del día', description: 'Concepto general' })
	@IsString()
	@IsNotEmpty()
	concepto: string;

	@ApiProperty({ example: 1, description: 'ID del Periodo Contable en estado ABIERTO' })
	@IsInt()
	@IsNotEmpty()
	periodoId: number;

	@ApiProperty({ example: 1, description: 'ID del Usuario logueado' })
	@IsInt()
	@IsNotEmpty()
	creadoPorId: number;

	@ApiProperty({ required: false, example: 'Ingreso' })
	@IsOptional()
	@IsString()
	modelo?: string;

	@ApiProperty({ required: false, example: 'V123' })
	@IsOptional()
	@IsString()
	comprobante?: string;

	@ApiProperty({ type: [CreateDetalleAsientoDto], description: 'Las líneas del asiento' })
	@ValidateNested({ each: true })
	@Type(() => CreateDetalleAsientoDto)
	@ArrayMinSize(2, { message: 'El asiento mínimo requiere 2 detalles contables' })
	detalles: CreateDetalleAsientoDto[];
}
