import { Module } from '@nestjs/common'
import { GenerateInvoiceService } from './services/generate-invoice.service'
import { GeneratePdfService } from './services/generate-pdf.service'
import { SignInvoiceService } from './services/sign-invoice.service'
import { EmailModule } from './email/email.module'
import { ElectronicInvoiceService } from './services/electronic-invoice.service'
import { GenerateLiquidacionCompraService } from './services/generate-liquidacion-compra.service'
import { LiquidacionCompraController } from './controllers/liquidacion-compra.controller'

@Module({
  controllers: [LiquidacionCompraController],
  providers: [
    GenerateInvoiceService,
    GeneratePdfService,
    SignInvoiceService,
    ElectronicInvoiceService,
    GenerateLiquidacionCompraService,
  ],
  imports: [EmailModule],
  exports: [GenerateInvoiceService, ElectronicInvoiceService, GenerateLiquidacionCompraService],
})
export class FacturacionModule {}
