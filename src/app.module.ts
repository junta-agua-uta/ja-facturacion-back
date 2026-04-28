import { Module } from '@nestjs/common'
import { CommonModule } from './common/common.module'
import { AuthModule } from './auth/auth.module'
import { ClientesModule } from './clientes/clientes.module'
import { FacturasModule } from './facturas/facturas.module'
import { SucursalesModule } from './sucursales/sucursales.module'
import { FacturacionModule } from './facturacion-electronica/facturacion.module'
import { MedidoresModule } from './medidores/medidores.module'
import { RazonesModule } from './razones/razones.module'
import { LiquidacionComprasModule } from './liquidacion-compras/liquidacion-compras.module'
import { ConceptosModule } from './conceptos/conceptos.module'
import { PlanCuentasModule } from './plan-cuentas/plan-cuentas.module'
import { PeriodosContablesModule } from './periodos-contables/periodos-contables.module'
import { AsientosModule } from './asientos/asientos.module'
import { ReportesModule } from './reportes/reportes.module'
import { EmpresaModule } from './empresa/empresa.module'
import { ConfigAsientosAutoModule } from './config-asientos-auto/config-asientos-auto.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    AuthModule,
    ClientesModule,
    MedidoresModule,
    FacturasModule,
    CommonModule,
    SucursalesModule,
    FacturacionModule,
    RazonesModule,
    LiquidacionComprasModule,
    ConceptosModule,
    PlanCuentasModule,
    PeriodosContablesModule,
    AsientosModule,
    ReportesModule,
    EmpresaModule,
    ConfigAsientosAutoModule,
    UsersModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
