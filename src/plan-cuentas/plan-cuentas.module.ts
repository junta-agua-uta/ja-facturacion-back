import { Module } from '@nestjs/common';
import { PlanCuentasController } from './plan-cuentas.controller';
import { PlanCuentasService } from './plan-cuentas.service';

@Module({
  controllers: [PlanCuentasController],
  providers: [PlanCuentasService]
})
export class PlanCuentasModule {}
