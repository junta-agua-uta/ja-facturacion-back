import { ApiProperty } from '@nestjs/swagger'

export class PdfItemDto {
  @ApiProperty({ description: 'Código del producto', example: 'A001' })
  code: string

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Producto X',
  })
  description: string

  @ApiProperty({ description: 'Cantidad', example: 2 })
  quantity: number

  @ApiProperty({ description: 'Precio unitario', example: 50.0 })
  unitPrice: number

  @ApiProperty({ description: 'Descuento', example: 0.0 })
  descount: number
}

export class PdfDataDto {
  @ApiProperty({
    description: 'Nombre comercial',
    example: 'EMPRESA COMERCIAL',
  })
  comertialName: string

  @ApiProperty({ description: 'Obligado a llevar contabilidad', example: 'SI' })
  contabilidad: string

  @ApiProperty({ description: 'RUC', example: '1790012345001' })
  ruc: string

  @ApiProperty({
    description: 'Número de factura',
    example: '001-002-000000123',
  })
  invoiceNumber: string

  @ApiProperty({
    description: 'Fecha de autorización',
    example: '2024-05-21T12:00:00Z',
  })
  dateAuthorization: string

  @ApiProperty({ description: 'Ambiente', example: 'PRUEBAS' })
  ambiente: string

  @ApiProperty({ description: 'Tipo de emisión', example: 'NORMAL' })
  emition: string

  @ApiProperty({ description: 'Número de autorización', example: '1234567890' })
  authorizationNumber: string

  @ApiProperty({
    description: 'Clave de acceso',
    example: '1234567890123456789012345678901234567890123456789',
  })
  accessKey: string

  @ApiProperty({ description: 'Nombre del cliente', example: 'Juan Pérez' })
  clientName: string

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Calle Falsa 456',
  })
  clientAddress: string

  @ApiProperty({
    description: 'Identificación del cliente',
    example: '1790012345001',
  })
  clientId: string

  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'cliente@correo.com',
  })
  clientEmail: string

  @ApiProperty({ description: 'Fecha de emisión', example: '2024-05-21' })
  dateEmition: string

  @ApiProperty({
    description: 'Lista de ítems de la factura',
    type: [PdfItemDto],
  })
  items: PdfItemDto[]

  @ApiProperty({ description: 'Subtotal', example: 100.0 })
  subTotal: number

  @ApiProperty({ description: 'Descuento total', example: 0.0 })
  descount: number

  @ApiProperty({ description: 'IVA', example: 12.0 })
  iva: number

  @ApiProperty({ description: 'Total', example: 112.0 })
  total: number
}
