// filepath: c:\Users\edder\OneDrive\Escritorio\Junta Medidores\JuntaAgua\src\medidores\medidores.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import { CrearMedidorDto } from './dtos/crearMedidor.dto'
import { EditarMedidorDto } from './dtos/editarMedidor.dto'
import { ObtenerMedidoresDto } from './dtos/obtenerMedidores.dto'
import { CrudMedidorService } from './services/crudMedidor.service'
import { ObtenerMedidorService } from './services/obtenerMedidor.service'
import { AuthGuard } from '../auth/guards/auth.guard'

@ApiTags('Medidores')
@Controller('medidores')
@UseGuards(AuthGuard)
export class MedidoresController {
  constructor(
    private readonly crudMedidorService: CrudMedidorService,
    private readonly obtenerMedidorService: ObtenerMedidorService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los medidores con paginación y filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de medidores obtenido correctamente',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Registros por página',
  })
  @ApiQuery({
    name: 'idCliente',
    required: false,
    description: 'ID del cliente para filtrar',
  })
  @ApiQuery({
    name: 'numeroMedidor',
    required: false,
    description: 'Número del medidor para filtrar',
  })
  async obtenerMedidores(@Query() query: ObtenerMedidoresDto) {
    const { page, limit, idCliente, numeroMedidor } = query
    return this.crudMedidorService.obtenerMedidores(
      page,
      limit,
      idCliente,
      numeroMedidor,
    )
  }
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un medidor por su ID' })
  @ApiResponse({ status: 200, description: 'Medidor encontrado' })
  @ApiResponse({ status: 404, description: 'Medidor no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del medidor' })
  async obtenerMedidorPorId(@Param('id') id: string) {
    return this.obtenerMedidorService.obtenerMedidorPorId(id)
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo medidor' })
  @ApiResponse({ status: 201, description: 'Medidor creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async crearMedidor(@Body() medidorData: CrearMedidorDto) {
    return this.crudMedidorService.crearMedidor(medidorData)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un medidor existente' })
  @ApiResponse({
    status: 200,
    description: 'Medidor actualizado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Medidor no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del medidor a actualizar' })
  async editarMedidor(
    @Param('id') id: number,
    @Body() medidorData: EditarMedidorDto,
  ) {
    return this.crudMedidorService.editarMedidor(id, medidorData)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un medidor' })
  @ApiResponse({ status: 200, description: 'Medidor eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Medidor no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del medidor a eliminar' })
  async eliminarMedidor(@Param('id') id: number) {
    return this.crudMedidorService.eliminarMedidor(id)
  }
}
