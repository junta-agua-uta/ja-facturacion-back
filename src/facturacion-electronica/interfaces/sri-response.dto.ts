import { ApiProperty } from '@nestjs/swagger'

export class RespuestaRecepcionComprobanteDto {
  @ApiProperty({ description: 'Estado de la recepción', example: 'RECIBIDA' })
  estado: string

  @ApiProperty({
    description: 'Comprobantes recibidos',
    example: null,
    nullable: true,
  })
  comprobantes: unknown // Puedes ajustar el tipo si tienes la estructura
}

export class SRIAuthorizationDto {
  @ApiProperty({ type: RespuestaRecepcionComprobanteDto })
  RespuestaRecepcionComprobante: RespuestaRecepcionComprobanteDto
}

export class AutorizacionDto {
  @ApiProperty({
    description: 'Estado de la autorización',
    example: 'AUTORIZADO',
  })
  estado: string

  @ApiProperty({ description: 'Número de autorización', example: '1234567890' })
  numeroAutorizacion: string

  @ApiProperty({
    description: 'Fecha de autorización',
    example: '2024-05-20T12:34:56Z',
  })
  fechaAutorizacion: string

  @ApiProperty({ description: 'Ambiente', example: '1' })
  ambiente: string

  @ApiProperty({ description: 'Comprobante', example: '<xml>...</xml>' })
  comprobante: string

  @ApiProperty({ description: 'Mensajes', example: null, nullable: true })
  mensajes: unknown // Puedes ajustar el tipo si tienes la estructura
}

export class AutorizacionesDto {
  @ApiProperty({ type: AutorizacionDto })
  autorizacion: AutorizacionDto
}

export class RespuestaAutorizacionComprobanteDto {
  @ApiProperty({
    description: 'Clave de acceso consultada',
    example: '1234567890',
  })
  claveAccesoConsultada: string

  @ApiProperty({ description: 'Número de comprobantes', example: '1' })
  numeroComprobantes: string

  @ApiProperty({ type: AutorizacionesDto })
  autorizaciones: AutorizacionesDto
}

export class SRIResponseDto {
  @ApiProperty({ type: RespuestaAutorizacionComprobanteDto })
  RespuestaAutorizacionComprobante: RespuestaAutorizacionComprobanteDto
}
