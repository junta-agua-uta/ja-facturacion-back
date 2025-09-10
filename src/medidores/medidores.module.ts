import { Module } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { MedidoresController } from './medidores.controller'
import { CrudMedidorService } from './services/crudMedidor.service'
import { ObtenerMedidorService } from './services/obtenerMedidor.service'

@Module({
  controllers: [MedidoresController],
  providers: [PrismaClient, CrudMedidorService, ObtenerMedidorService],
  exports: [CrudMedidorService, ObtenerMedidorService],
})
export class MedidoresModule {}
