import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator'
import { IsEcuadorRuc } from 'src/common/decorators/ecuadorian-ruc.decorator'

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
  @IsEcuadorRuc({ message: 'El RUC registrado no es válido' })
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

  @ApiProperty({
    description: 'Modo de generación de asientos de facturas',
    enum: ['INDIVIDUAL', 'DIARIO', 'MENSUAL'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'DIARIO', 'MENSUAL'])
  modoAsientos?: string
}