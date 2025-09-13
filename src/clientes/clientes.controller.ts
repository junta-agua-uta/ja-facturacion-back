import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { BuscarClientePorNombreService } from './services/buscarClientePorNombre.service'
import { BuscarClientePorCedulaService } from './services/buscarClientePorCedula.service'
import { CrudClienteService } from './services/crudCliente.service'
import { CrearClienteDto } from './dtos/crearCliente.dto'
import { EditarClienteDto } from './dtos/editarCliente.dto'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { RoleGuard } from 'src/auth/guards/role.guard'
// import { Rol } from 'src/common/decorators/role.decorator'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { Response } from 'express'
import { GenerarExcelClientesService } from './services/generar-excel-clientes.service'
import { ObtenerTodosClientesService } from './services/obtenerTodosClientes.service'

@ApiTags('Clientes')
/* @Rol('ADMIN') */
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly clienteService: BuscarClientePorNombreService,
    private readonly buscarClientePorCedulaService: BuscarClientePorCedulaService,
    private readonly crudClienteService: CrudClienteService,
    private readonly generarExcelClientes: GenerarExcelClientesService,
    private readonly obtenerTodosClientes: ObtenerTodosClientesService,
  ) {}

  @ApiOperation({
    summary: 'Buscar cliente por nombre',
    description: 'Busca clientes por su razón social exacta (case insensitive)',
  })
  @ApiOperation({ summary: 'Descargar reporte de clientes en Excel' })
  @Get('/reporte')
  async descargarReporteClientes(@Res() response: Response) {
    const clientes = await this.obtenerTodosClientes.obtenerTodos()
    await this.generarExcelClientes.generarReporteClientes(response, clientes)
  }

  @Get('buscar')
  async buscarClientePorNombre(@Query('nombre') nombre: string) {
    try {
      if (!nombre) {
        throw new Error('El nombre es requerido')
      }

      const cliente = await this.clienteService.buscarClientePorNombre(nombre)
      return cliente
    } catch (error) {
      Logger.error('Error al buscar cliente:', error.message)
      throw new Error('Error al buscar cliente: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Buscar cliente por cedula',
    description: 'Busca clientes por su cedula',
  })
  @Get('buscarCedula')
  async buscarClientePorCedula(@Query('cedula') cedula: string) {
    try {
      if (!cedula) {
        throw new Error('La cédula es requerida')
      }

      const cliente =
        await this.buscarClientePorCedulaService.buscarClientePorCedula(cedula)
      return cliente
    } catch (error) {
      Logger.error('Error al buscar cliente:', error.message)
      throw new Error('Error al buscar cliente: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener todos los clientes',
    description: 'Obtiene una lista de todos los clientes',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  async obtenerClientes(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
  ) {
    try {
      const clientes = await this.crudClienteService.obtenerClientes(
        page,
        limit,
      )
      return clientes
    } catch (error) {
      Logger.error('Error al obtener clientes:', error.message)
      throw new Error('Error al obtener clientes: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Crear cliente',
    description: 'Crea un nuevo cliente',
  })
  @Post()
  async crearCliente(@Body() clientData: CrearClienteDto) {
    try {
      const clienteCreado =
        await this.crudClienteService.crearCliente(clientData)
      return clienteCreado
    } catch (error) {
      Logger.error('Error al crear cliente:', error.message)
      throw new Error('Error al crear cliente: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Editar cliente',
    description: 'Edita un cliente existente',
  })
  @Put(':id')
  async editarCliente(
    @Param('id') id: string,
    @Body() clientData: EditarClienteDto,
  ) {
    try {
      const clienteEditado = await this.crudClienteService.editarCliente(
        parseInt(id, 10),
        clientData,
      )
      return clienteEditado
    } catch (error) {
      Logger.error('Error al editar cliente:', error.message)
      throw new Error('Error al editar cliente: ' + error.message)
    }
  }
}
