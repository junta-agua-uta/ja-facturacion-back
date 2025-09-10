import { Module } from '@nestjs/common'
import { GenerateInvoiceService } from './services/generate-invoice.service'
import { GeneratePdfService } from './services/generate-pdf.service'
import { SignInvoiceService } from './services/sign-invoice.service'
import { EmailModule } from './email/email.module'
import { ElectronicInvoiceService } from './services/electronic-invoice.service'

@Module({
  controllers: [],
  providers: [
    GenerateInvoiceService,
    GeneratePdfService,
    SignInvoiceService,
    ElectronicInvoiceService,
  ],
  imports: [EmailModule],
  exports: [GenerateInvoiceService, ElectronicInvoiceService],
})
export class FacturacionModule {}
