import { Module } from '@nestjs/common'
import { SucursalesController } from './sucursales.controller'
import { CrudSucursalesService } from './services/crudSucursales.service'
import { SucursalesService } from './services/obtenerSucursales.service'

@Module({
  controllers: [SucursalesController],
  providers: [CrudSucursalesService, SucursalesService],
  imports: [],
  exports: [],
})
export class SucursalesModule {}
