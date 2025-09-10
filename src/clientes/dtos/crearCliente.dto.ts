import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  Matches,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CrearClienteDto {
  @ApiProperty({
    description: 'Cedula del cliente(es requerido)',
    example: '1812345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$|^\d{13}$/, {
    message:
      'La identificación debe tener 10 dígitos (cédula) o 13 dígitos (RUC)',
  })
  identificacion: string

  @ApiProperty({
    description: 'Razon social del cliente(es requerido)',
    example: 'Empresa Ejemplo S.A.',
  })
  @IsString()
  @IsNotEmpty()
  razonSocial: string

  @ApiProperty({
    description: 'Nombre Comercial del cliente(no es requerido)',
    example: 'Comercial Ejemplo',
  })
  @IsOptional()
  @IsString()
  nombreComercial?: string

  @ApiProperty({
    description: 'Direccion del cliente(es requerido)',
    example: 'Av. Principal 123',
  })
  @IsString()
  @IsNotEmpty()
  direccion: string

  @ApiProperty({
    description: 'Telefono1 del cliente(es requerido)',
    example: '0991234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{8}$/, {
    message: 'El teléfono debe comenzar con 09 y tener 10 dígitos',
  })
  telefono1: string

  @ApiPropertyOptional({
    description: 'Teléfono 2 del cliente (opcional)',
    example: '0987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefono2?: string

  @ApiPropertyOptional({
    description: 'Correo del cliente (opcional)',
    example: 'correo@gmail.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  correo?: string

  @ApiPropertyOptional({
    description: 'Tarifa del cliente (opcional)',
    example: 'Tarifa A',
    required: false,
  })
  @IsOptional()
  @IsString()
  tarifa?: string

  @ApiPropertyOptional({
    description: 'Grupo del cliente (opcional)',
    example: 'Grupo 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  grupo?: string

  @ApiPropertyOptional({
    description: 'Zona del cliente (opcional)',
    example: 'Zona Norte',
    required: false,
  })
  @IsOptional()
  @IsString()
  zona?: string

  @ApiPropertyOptional({
    description: 'Ruta del cliente (opcional)',
    example: 'Ruta 5',
    required: false,
  })
  @IsOptional()
  @IsString()
  ruta?: string

  @ApiPropertyOptional({
    description: 'Vendedor del cliente (opcional)',
    example: 'Juan Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  vendedor?: string

  @ApiPropertyOptional({
    description: 'Cobrador del cliente (opcional)',
    example: 'Maria Lopez',
    required: false,
  })
  @IsOptional()
  @IsString()
  cobrador?: string

  @ApiPropertyOptional({
    description: 'Provincia del cliente (opcional)',
    example: 'Pichincha',
    required: false,
  })
  @IsOptional()
  @IsString()
  provincia?: string

  @ApiPropertyOptional({
    description: 'Ciudad del cliente (opcional)',
    example: 'Quito',
    required: false,
  })
  @IsOptional()
  @IsString()
  ciudad?: string

  @ApiPropertyOptional({
    description: 'Parroquia del cliente (opcional)',
    example: 'La Mariscal',
    required: false,
  })
  @IsOptional()
  @IsString()
  parroquia?: string
}
