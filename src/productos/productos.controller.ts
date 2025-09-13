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
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { BuscarProductoPorDescripcionService } from './service/buscarProductoPorDescripcion.service'
import { BuscarProductoPorCodigoService } from './service/buscarProductoPorCodigo.service'
import { CrudProductoService } from './service/crudProducto.service'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { CrearProductoDto } from './dtos/crearProducto.dto'
import { EditarProductoDto } from './dtos/editarProducto.dto'
import { RoleGuard } from 'src/auth/guards/role.guard'

@ApiTags('Productos')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
@Controller('productos')
export class ProductosController {
  constructor(
    private readonly buscarPorDescripcionService: BuscarProductoPorDescripcionService,
    private readonly buscarPorCodigoService: BuscarProductoPorCodigoService,
    private readonly crudProductoService: CrudProductoService,
  ) {}

  @ApiOperation({
    summary: 'Buscar productos por descripción',
    description:
      'Busca productos por una parte de la descripción (case insensitive)',
  })
  @Get('buscar')
  async buscarPorDescripcion(@Query('descripcion') descripcion: string) {
    try {
      if (!descripcion) {
        throw new Error('La descripción es requerida')
      }
      return await this.buscarPorDescripcionService.buscarProductoPorDescripcion(
        descripcion,
      )
    } catch (error: any) {
      Logger.error('Error al buscar producto por descripción:', error.message)
      throw new Error('Error al buscar producto: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Buscar producto por código',
    description:
      'Busca productos por código exacto (se normaliza a mayúsculas)',
  })
  @Get('buscarCodigo')
  async buscarPorCodigo(@Query('codigo') codigo: string) {
    try {
      if (!codigo) {
        throw new Error('El código es requerido')
      }
      return await this.buscarPorCodigoService.buscarProductoPorCodigo(codigo)
    } catch (error: any) {
      Logger.error('Error al buscar producto por código:', error.message)
      throw new Error('Error al buscar producto: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener productos',
    description: 'Lista productos con paginación y búsqueda opcional',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get()
  async obtenerProductos(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    try {
      return await this.crudProductoService.obtenerProductos({
        page,
        limit,
        search,
      })
    } catch (error: any) {
      Logger.error('Error al obtener productos:', error.message)
      throw new Error('Error al obtener productos: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Crear producto',
    description: 'Crea un nuevo producto',
  })
  @Post()
  async crearProducto(@Body() dto: CrearProductoDto) {
    try {
      return await this.crudProductoService.crearProducto(dto)
    } catch (error: any) {
      Logger.error('Error al crear producto:', error.message)
      throw new Error('Error al crear producto: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Editar producto',
    description: 'Edita un producto existente por ID',
  })
  @Put(':id')
  async editarProducto(
    @Param('id') id: string,
    @Body() dto: EditarProductoDto,
  ) {
    try {
      return await this.crudProductoService.editarProducto(
        parseInt(id, 10),
        dto,
      )
    } catch (error: any) {
      Logger.error('Error al editar producto:', error.message)
      throw new Error('Error al editar producto: ' + error.message)
    }
  }
}
