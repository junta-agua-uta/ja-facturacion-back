import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TaxInfoDto } from './tax-info.dto'
import { InvoiceInfoDto } from './invoice-info.dto'
import { DetailsDto } from './details.dto'
import { ReimbursementsDto } from './reimbursaments.dto'
import { RetentionsDto } from './retention.dto'
import { RemisionGuideSustitutiveInfoDto } from './remission-guides-sustitutive-info.dto'
import { OtherThirdPartValuesDto } from './third-part-values.dto'
import { AdditionalInfoDto } from './aditional-info.dto'

class TipoNegociableDto {
  @ApiProperty({
    description: 'Correo electrónico',
    example: 'correo@ejemplo.com',
  })
  correo: string
}

class MaquinaFiscalDto {
  @ApiProperty({ description: 'Marca de la máquina fiscal', example: 'Epson' })
  marca: string

  @ApiProperty({
    description: 'Modelo de la máquina fiscal',
    example: 'TM-T88V',
  })
  modelo: string

  @ApiProperty({
    description: 'Serie de la máquina fiscal',
    example: '123456789',
  })
  serie: string
}

export class InvoiceDto {
  @ApiProperty({
    description: 'Factura principal',
    type: () => FacturaDto,
  })
  factura: FacturaDto
}

export class FacturaDto {
  @ApiPropertyOptional({ example: 'http://www.w3.org/2000/09/xmldsig#' })
  '@xmlns:ds'?: string

  @ApiPropertyOptional({ example: 'http://www.w3.org/2001/XMLSchema-instance' })
  '@xmlns:xsi'?: string

  @ApiProperty({ example: 'comprobante' })
  '@id': string

  @ApiProperty({ example: '1.0.0' })
  '@version': string

  @ApiProperty({ type: TaxInfoDto })
  infoTributaria: TaxInfoDto

  @ApiProperty({ type: InvoiceInfoDto })
  infoFactura: InvoiceInfoDto

  @ApiProperty({ type: DetailsDto })
  detalles: DetailsDto

  @ApiPropertyOptional({ type: ReimbursementsDto })
  reembolsos?: ReimbursementsDto

  @ApiPropertyOptional({ type: RetentionsDto })
  retenciones?: RetentionsDto

  @ApiPropertyOptional({ type: RemisionGuideSustitutiveInfoDto })
  infoSustitutivaGuiaRemision?: RemisionGuideSustitutiveInfoDto

  @ApiPropertyOptional({ type: OtherThirdPartValuesDto })
  otrosRubrosTerceros?: OtherThirdPartValuesDto

  @ApiPropertyOptional({ type: TipoNegociableDto })
  tipoNegociable?: TipoNegociableDto

  @ApiPropertyOptional({ type: MaquinaFiscalDto })
  maquinaFiscal?: MaquinaFiscalDto

  @ApiPropertyOptional({ type: AdditionalInfoDto })
  infoAdicional?: AdditionalInfoDto
}

export class InvoiceInputDto {
  @ApiProperty({
    type: TaxInfoDto,
    description: 'Información tributaria (sin claveAcceso)',
  })
  infoTributaria: Omit<TaxInfoDto, 'claveAcceso'>

  @ApiProperty({
    type: InvoiceInfoDto,
    description: 'Información de la factura',
  })
  infoFactura: InvoiceInfoDto

  @ApiProperty({ type: DetailsDto, description: 'Detalles de la factura' })
  detalles: DetailsDto

  @ApiPropertyOptional({ type: ReimbursementsDto, description: 'Reembolsos' })
  reembolsos?: ReimbursementsDto

  @ApiPropertyOptional({ type: RetentionsDto, description: 'Retenciones' })
  retenciones?: RetentionsDto

  @ApiPropertyOptional({
    type: RemisionGuideSustitutiveInfoDto,
    description: 'Información sustitutiva de guía de remisión',
  })
  infoSustitutivaGuiaRemision?: RemisionGuideSustitutiveInfoDto

  @ApiPropertyOptional({
    type: OtherThirdPartValuesDto,
    description: 'Otros rubros de terceros',
  })
  otrosRubrosTerceros?: OtherThirdPartValuesDto

  @ApiPropertyOptional({
    type: TipoNegociableDto,
    description: 'Tipo negociable',
  })
  tipoNegociable?: TipoNegociableDto

  @ApiPropertyOptional({
    type: MaquinaFiscalDto,
    description: 'Máquina fiscal',
  })
  maquinaFiscal?: MaquinaFiscalDto

  @ApiPropertyOptional({
    type: AdditionalInfoDto,
    description: 'Información adicional',
  })
  infoAdicional?: AdditionalInfoDto
}
