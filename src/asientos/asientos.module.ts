import { Module } from '@nestjs/common';
import { AsientosController } from './asientos.controller';
import { AsientosService } from './asientos.service';

@Module({
  controllers: [AsientosController],
  providers: [AsientosService]
})
export class AsientosModule {}
