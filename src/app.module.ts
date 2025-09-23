import { Module } from '@nestjs/common'
import { CommonModule } from './common/common.module'
import { AuthModule } from './auth/auth.module'
import { ClientesModule } from './clientes/clientes.module'
import { FacturasModule } from './facturas/facturas.module'
import { SucursalesModule } from './sucursales/sucursales.module'
import { FacturacionModule } from './facturacion-electronica/facturacion.module'
import { MedidoresModule } from './medidores/medidores.module'
import { RazonesModule } from './razones/razones.module'
import { ConceptosModule } from './conceptos/conceptos.module'


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
    ConceptosModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
