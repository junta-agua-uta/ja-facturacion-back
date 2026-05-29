/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsDateString } from 'class-validator';

export class FiltrosReporteDto {

    @ApiProperty({
        example: 1,
        description: 'ID de la empresa',
        default: 1,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    empresaId: number = 1;

    @ApiProperty({
        example: 1,
        description: 'ID del periodo contable',
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    periodoId?: number;

    @ApiProperty({
        example: '2026-01-01',
        description: 'Fecha inicio del rango',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @ApiProperty({
        example: '2026-12-31',
        description: 'Fecha fin del rango',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    fechaFin?: string;
}