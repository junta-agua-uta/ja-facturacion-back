import { Module } from '@nestjs/common'
import { GenerateInvoiceService } from './services/generate-invoice.service'
import { GeneratePdfService } from './services/generate-pdf.service'
import { SignInvoiceService } from './services/sign-invoice.service'
import { EmailModule } from './email/email.module'
import { ElectronicInvoiceService } from './services/electronic-invoice.service'
import { GenerateLiquidacionCompraService } from './services/generate-liquidacion-compra.service'
import { LiquidacionCompraController } from './controllers/liquidacion-compra.controller'
import { ElectronicLiquidacionService } from './services/electronic-liquidacion.service'
import { LiquidacionCalculationService } from './services/liquidacion-calculation.service'
import { GenerarExcelLiquidacionesService } from './services/generar-excel-liquidaciones.service'

@Module({
  controllers: [LiquidacionCompraController],
  providers: [
    GenerateInvoiceService,
    GeneratePdfService,
    SignInvoiceService,
    ElectronicInvoiceService,
    GenerateLiquidacionCompraService,
    ElectronicLiquidacionService,
    LiquidacionCalculationService,
    GenerarExcelLiquidacionesService,
  ],
  imports: [EmailModule],
  exports: [
    GenerateInvoiceService,
    ElectronicInvoiceService,
    GenerateLiquidacionCompraService,
    ElectronicLiquidacionService,
  ],
})
export class FacturacionModule {}
