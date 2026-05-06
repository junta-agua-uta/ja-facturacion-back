import { IsEmail, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  @MaxLength(191)
  nombre?: string

  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(191)
  ruc?: string

  @IsOptional()
  @IsString()
  @MaxLength(191)
  direccion?: string

  @IsOptional()
  @IsString()
  @MaxLength(191)
  telefono?: string

  @IsOptional()
  @IsString()
  @MaxLength(191)
  moneda?: string

  @IsOptional()
  @IsString()
  @MaxLength(191)
  representanteLegal?: string

  @IsOptional()
  @IsString()
  @MaxLength(191)
  logo?: string

  @ApiProperty({ description: 'Modo de generación de asientos de facturas', enum: ['INDIVIDUAL', 'DIARIO', 'MENSUAL'], required: false })
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'DIARIO', 'MENSUAL'])
  modoAsientos?: string
}