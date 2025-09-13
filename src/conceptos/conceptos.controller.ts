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
import { BuscarConceptoPorDescripcionService } from './service/buscarConceptoPorDescripcion.service'
import { BuscarConceptoPorCodigoService } from './service/buscarConceptoPorCodigo.service'
import { CrudConceptoService } from './service/crudConcepto.service'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { RoleGuard } from 'src/auth/guards/role.guard'
import { CrearConceptoDto } from './dtos/crearConcepto.dto'
import { EditarConceptoDto } from './dtos/editarConcepto.dto'

@ApiTags('Conceptos')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
@Controller('conceptos')
export class ConceptosController {
  constructor(
    private readonly buscarPorDescripcionService: BuscarConceptoPorDescripcionService,
    private readonly buscarPorCodigoService: BuscarConceptoPorCodigoService,
    private readonly crudConceptoService: CrudConceptoService,
  ) {}

  @ApiOperation({
    summary: 'Buscar conceptos por descripción',
    description:
      'Busca conceptos por una parte de la descripción (case insensitive)',
  })
  @Get('buscar')
  async buscarPorDescripcion(@Query('descripcion') descripcion: string) {
    try {
      if (!descripcion) {
        throw new Error('La descripción es requerida')
      }
      return await this.buscarPorDescripcionService.buscarPorDescripcion(
        descripcion,
      )
    } catch (error: any) {
      Logger.error('Error al buscar concepto por descripción:', error.message)
      throw new Error('Error al buscar concepto: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Buscar concepto por código',
    description:
      'Busca un concepto por código exacto (se normaliza a mayúsculas)',
  })
  @Get('buscarCodigo')
  async buscarPorCodigo(@Query('codigo') codigo: string) {
    try {
      if (!codigo) {
        throw new Error('El código es requerido')
      }
      return await this.buscarPorCodigoService.buscarPorCodigo(codigo)
    } catch (error: any) {
      Logger.error('Error al buscar concepto por código:', error.message)
      throw new Error('Error al buscar concepto: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener conceptos',
    description: 'Lista conceptos con paginación y búsqueda opcional',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get()
  async obtenerConceptos(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    try {
      return await this.crudConceptoService.obtenerConceptos({
        page,
        limit,
        search,
      })
    } catch (error: any) {
      Logger.error('Error al obtener conceptos:', error.message)
      throw new Error('Error al obtener conceptos: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Crear concepto',
    description: 'Crea un nuevo concepto',
  })
  @Post()
  async crearConcepto(@Body() dto: CrearConceptoDto) {
    try {
      return await this.crudConceptoService.crearConcepto(dto)
    } catch (error: any) {
      Logger.error('Error al crear concepto:', error.message)
      throw new Error('Error al crear concepto: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Editar concepto',
    description: 'Edita un concepto existente por ID',
  })
  @Put(':id')
  async editarConcepto(
    @Param('id') id: string,
    @Body() dto: EditarConceptoDto,
  ) {
    try {
      return await this.crudConceptoService.editarConcepto(id, dto)
    } catch (error: any) {
      Logger.error('Error al editar concepto:', error.message)
      throw new Error('Error al editar concepto: ' + error.message)
    }
  }
}
