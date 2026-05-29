import { Module } from '@nestjs/common'
import { PeriodosContablesController } from './periodos-contables.controller'
import { PeriodosContablesService } from './periodos-contables.service'

@Module({
  controllers: [PeriodosContablesController],
  providers: [PeriodosContablesService],
})
export class PeriodosContablesModule {}
