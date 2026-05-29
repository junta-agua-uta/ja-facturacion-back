/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { FiltrosReporteDto } from './filtros-reporte.dto';

export class FiltrosDetalleCuentaDto extends FiltrosReporteDto {

    @ApiProperty({
        example: 101,
        description: 'ID de la cuenta contable',
    })
    @Type(() => Number)
    @IsInt()
    cuentaId: number;
}