import { Module } from '@nestjs/common'
import { BuscarClientePorNombreService } from './services/buscarClientePorNombre.service'
import { BuscarClientePorCedulaService } from './services/buscarClientePorCedula.service'
import { CrudClienteService } from './services/crudCliente.service'
import { ClientesController } from './clientes.controller'
import { GenerarExcelClientesService } from './services/generar-excel-clientes.service'
import { ObtenerTodosClientesService } from './services/obtenerTodosClientes.service'

@Module({
  controllers: [ClientesController],
  providers: [
    BuscarClientePorNombreService,
    BuscarClientePorCedulaService,
    CrudClienteService,
    GenerarExcelClientesService,
    ObtenerTodosClientesService,
  ],
  imports: [],
})
export class ClientesModule {}
