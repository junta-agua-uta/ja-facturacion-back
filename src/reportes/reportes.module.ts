/* eslint-disable prettier/prettier */

import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { LibroMayorPdfService } from './services/libro-mayor-pdf.service';
import { LibroMayorService } from './services/libro-mayor.service';
import { MovimientosRepository } from './base/movimientos.repository';
import { LibroMayorExcelService } from './services/libro-mayor-excel.service';
import { BalanceComprobacionService } from './services/balance-comprobacion.service';
import { BalanceComprobacionPdfService } from './services/balance-comprobacion-pdf.service';
import { BalanceComprobacionExcelService } from './services/balance-comprobacion-excel.service';
import { BalanceGeneralService } from './services/balance-general.service';
import { BalanceGeneralExcelService } from './services/balance-general-excel.service';
import { BalanceGeneralPdfService } from './services/balance-general-pdf.service';
import { EstadoResultadosService } from './services/estado-resultados.service';
import { EstadoResultadosExcelService } from './services/estado-resultados-excel.service';
import { EstadoResultadosPdfService } from './services/estado-resultados-pdf.service';
import { CarteraClientesService } from './services/cartera-clientes.service';
import { CarteraClientesExcelService } from './services/cartera-clientes-excel.service';
import { CarteraClientesPdfService } from './services/cartera-clientes-pdf.service';

@Module({
  controllers: [ReportesController],
  providers: [
    ReportesService,
    LibroMayorPdfService,
    LibroMayorService,
    MovimientosRepository,
    LibroMayorExcelService,
    BalanceComprobacionService,
    BalanceComprobacionPdfService,
    BalanceComprobacionExcelService,
    BalanceGeneralService,
    BalanceGeneralExcelService,
    BalanceGeneralPdfService,
    EstadoResultadosService,
    EstadoResultadosExcelService,
    EstadoResultadosPdfService,
    CarteraClientesService,
    CarteraClientesExcelService,
    CarteraClientesPdfService,
  ]
})
export class ReportesModule { }
