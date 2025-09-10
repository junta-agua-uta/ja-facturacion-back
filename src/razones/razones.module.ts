import { Module } from '@nestjs/common'
import { RazonesService } from './crudRazones.service'
import { RazonesController } from './razones.controller'

@Module({
  imports: [],
  providers: [RazonesService],
  controllers: [RazonesController],
})
export class RazonesModule {}
