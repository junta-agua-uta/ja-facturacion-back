import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

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
}