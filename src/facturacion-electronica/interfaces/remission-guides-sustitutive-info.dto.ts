import { ApiProperty } from '@nestjs/swagger'

export class ArrivalDto {
  @ApiProperty({
    description: 'Motivo del traslado',
    example: 'Entrega de mercancía',
  })
  motivoTraslado: string

  @ApiProperty({
    description: 'Documento Aduanero Único',
    example: 'DAU123456',
  })
  docAduaneroUnico: string

  @ApiProperty({
    description: 'Código del establecimiento destino',
    example: '002',
  })
  codEstabDestino: string

  @ApiProperty({ description: 'Ruta', example: 'Quito - Guayaquil' })
  ruta: string
}

export class ArrivalsDto {
  @ApiProperty({
    description: 'Lista de destinos',
    type: [ArrivalDto],
  })
  destino: ArrivalDto[]
}

export class RemisionGuideSustitutiveInfoDto {
  @ApiProperty({
    description: 'Dirección de partida',
    example: 'Av. Siempre Viva 123',
  })
  dirPartida: string

  @ApiProperty({
    description: 'Dirección del destinatario',
    example: 'Calle Falsa 456',
  })
  dirDestinatario: string

  @ApiProperty({
    description: 'Fecha de inicio del transporte',
    example: '2024-05-20',
  })
  fechaIniTransporte: string

  @ApiProperty({
    description: 'Fecha de fin del transporte',
    example: '2024-05-21',
  })
  fechaFinTransporte: string

  @ApiProperty({
    description: 'Razón social del transportista',
    example: 'TRANSPORTES S.A.',
  })
  razonSocialTransportista: string

  @ApiProperty({
    description: 'Tipo de identificación del transportista',
    example: '04',
  })
  tipoIdentificacionTransportista: string

  @ApiProperty({
    description: 'RUC del transportista',
    example: '1790012345001',
  })
  rucTransportista: string

  @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-1234' })
  placa: string

  @ApiProperty({ description: 'Destinos', type: ArrivalsDto })
  destinos: ArrivalsDto
}
