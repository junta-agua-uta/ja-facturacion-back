import { Module } from '@nestjs/common'
import { BuscarClientePorNombreService } from './services/buscarClientePorNombre.service'
import { BuscarClientePorCedulaService } from './services/buscarClientePorCedula.service'
import { CrudClienteService } from './services/crudCliente.service'
import { ClientesController } from './clientes.controller'

@Module({
  controllers: [ClientesController],
  providers: [
    BuscarClientePorNombreService,
    BuscarClientePorCedulaService,
    CrudClienteService,
  ],
  imports: [],
})
export class ClientesModule {}
