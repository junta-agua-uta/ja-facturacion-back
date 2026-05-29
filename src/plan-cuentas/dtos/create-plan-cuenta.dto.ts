import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreatePlanCuentaDto {
	@ApiProperty({ example: '1.1.1', description: 'Código contable de la cuenta' })
	@IsString()
	@IsNotEmpty()
	codigo: string;

	@ApiProperty({ example: 'Caja', description: 'Nombre de la cuenta' })
	@IsString()
	@IsNotEmpty()
	nombre: string;

	@ApiProperty({ example: 'ACTIVO', description: 'Grupo o tipo al que pertenece la cuenta' })
	@IsString()
	@IsNotEmpty()
	@IsIn(['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESOS', 'GASTOS', 'COSTOS'])
	tipo: string;

	@ApiProperty({ example: 'DEUDORA', description: 'Naturaleza de la cuenta' })
	@IsString()
	@IsNotEmpty()
	@IsIn(['DEUDORA', 'ACREEDORA'])
	naturaleza: string;

	@ApiProperty({ required: false, example: '101', description: 'Código adicional / casillero referencial' })
	@IsOptional()
	@IsString()
	casillero?: string;

	@ApiProperty({ required: false, example: 5, description: 'ID de la cuenta padre en caso de ser subcuenta' })
	@IsOptional()
	@IsInt()
	padreId?: number;
}
