// dtos/update-plan-cuenta.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsBoolean,
  MinLength,
} from 'class-validator'

export class UpdatePlanCuentaDto {
  @ApiProperty({
    required: false,
    example: '1.1.01.01',
    description:
      'Nuevo código contable de la cuenta (opcional, validará jerarquía)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  codigo?: string

  @ApiProperty({
    required: false,
    example: 'Caja General',
    description: 'Nuevo nombre de la cuenta',
  })
  @IsOptional()
  @IsString()
  nombre?: string

  @ApiProperty({
    required: false,
    example: 'ACTIVO',
    description: 'Grupo o tipo al que pertenece la cuenta',
  })
  @IsOptional()
  @IsIn(['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESOS', 'GASTOS', 'COSTOS'])
  tipo?: string

  @ApiProperty({
    required: false,
    example: 'DEUDORA',
    description: 'Naturaleza de la cuenta',
  })
  @IsOptional()
  @IsIn(['DEUDORA', 'ACREEDORA'])
  naturaleza?: string

  @ApiProperty({
    required: false,
    example: '101',
    description: 'Código adicional / casillero referencial',
  })
  @IsOptional()
  @IsString()
  casillero?: string

  @ApiProperty({
    required: false,
    example: 3,
    description: 'ID de la nueva cuenta padre (null para mover a raíz)',
  })
  @IsOptional()
  @IsInt()
  padreId?: number | null

  @ApiProperty({
    required: false,
    example: false,
    description: 'Desactivar/Reactivar la cuenta',
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean
}
