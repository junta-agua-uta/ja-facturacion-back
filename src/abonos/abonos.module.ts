import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AbonosService } from './abonos.service';
import { AbonosController } from './abonos.controller';
import { AsientosModule } from '../asientos/asientos.module';

@Module({
  imports: [AsientosModule],
  controllers: [AbonosController],
  providers: [AbonosService, PrismaClient],
  exports: [AbonosService],
})
export class AbonosModule {}
