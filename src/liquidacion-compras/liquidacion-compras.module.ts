import { Module } from '@nestjs/common'
import { FacturacionModule } from '../facturacion-electronica/facturacion.module'

@Module({
  imports: [FacturacionModule],
})
export class LiquidacionComprasModule {}


