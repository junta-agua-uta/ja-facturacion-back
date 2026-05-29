import { Module } from '@nestjs/common'
import { ConfigAsientosAutoController } from './config-asientos-auto.controller'
import { ConfigAsientosAutoService } from './config-asientos-auto.service'

@Module({
  controllers: [ConfigAsientosAutoController],
  providers: [ConfigAsientosAutoService],
})
export class ConfigAsientosAutoModule {}