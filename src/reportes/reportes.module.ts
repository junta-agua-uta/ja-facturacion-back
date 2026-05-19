/* eslint-disable prettier/prettier */

import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { LibroMayorPdfService } from './services/libro-mayor-pdf.service';
import { LibroMayorService } from './services/libro-mayor.service';
import { MovimientosRepository } from './base/movimientos.repository';
import { LibroMayorExcelService } from './services/libro-mayor-excel.service';

@Module({
  controllers: [ReportesController],
  providers: [
    ReportesService,
    LibroMayorPdfService,
    LibroMayorService,
    MovimientosRepository,
    LibroMayorExcelService
  ]
})
export class ReportesModule { }
