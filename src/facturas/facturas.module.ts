import { Module } from '@nestjs/common'
import { FacturasController } from './facturas.controller'
import { ObtenerFacturaPorIdService } from './services/obtenerFacturaPorId.service'
import { ObtenerFacturaPorCedulaService } from './services/obtenerFacturaPorCedula.service'
import { ObtenerTodasLasFacturasService } from './services/obtenerTodasLasFacturas.service'
import { AgregarFacturaService } from './services/agregarFactura.service'
import { FacturacionModule } from 'src/facturacion-electronica/facturacion.module'
import { ObtenerFacturaPorFechaService } from './services/obtenerFacturasPorFecha.service'
import { GenerarExelService } from './services/generar-exel.service'

@Module({
  imports: [FacturacionModule],
  controllers: [FacturasController],
  providers: [
    ObtenerFacturaPorIdService,
    ObtenerFacturaPorCedulaService,
    ObtenerTodasLasFacturasService,
    AgregarFacturaService,
    ObtenerFacturaPorFechaService,
    GenerarExelService,
  ],
})
export class FacturasModule {}
