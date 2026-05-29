import { Module } from '@nestjs/common';
import { AsientosController } from './asientos.controller';
import { AsientosService } from './asientos.service';
import { AsientoAutomaticoService } from './asiento-automatico.service';
import { AsientoPdfService } from './services/asiento-pdf.service';

@Module({
  controllers: [AsientosController],
  providers: [AsientosService, AsientoAutomaticoService, AsientoPdfService],
  exports: [AsientoAutomaticoService],
})
export class AsientosModule {}
