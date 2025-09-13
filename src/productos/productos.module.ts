import { Module } from '@nestjs/common'
import { ProductosController } from './productos.controller'
import { BuscarProductoPorDescripcionService } from './service/buscarProductoPorDescripcion.service'
import { BuscarProductoPorCodigoService } from './service/buscarProductoPorCodigo.service'
import { CrudProductoService } from './service/crudProducto.service'

@Module({
  controllers: [ProductosController],
  providers: [
    BuscarProductoPorDescripcionService,
    BuscarProductoPorCodigoService,
    CrudProductoService,
  ],
  imports: [],
})
export class ProductosModule {}
