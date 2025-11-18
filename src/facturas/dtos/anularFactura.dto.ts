import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AnularFacturaDto {
  @ApiProperty({
    example: 'Documento emitido por error',
    description: 'Motivo de la anulación de la factura',
  })
  motivoAnulacion: string

  @ApiPropertyOptional({
    example: 'admin@empresa.com',
    description:
      'Usuario que realiza la anulación (opcional, se puede obtener del token)',
  })
  usuarioAnulacion?: string
}
