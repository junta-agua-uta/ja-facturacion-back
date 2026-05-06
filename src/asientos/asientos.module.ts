import { Module } from '@nestjs/common';
import { AsientosController } from './asientos.controller';
import { AsientosService } from './asientos.service';
import { AsientoAutomaticoService } from './asiento-automatico.service';

@Module({
  controllers: [AsientosController],
  providers: [AsientosService, AsientoAutomaticoService],
  exports: [AsientoAutomaticoService],
})
export class AsientosModule {}
