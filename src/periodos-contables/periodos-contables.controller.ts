import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Patch,
  Param,
  UseGuards,
  Post,
  Body,
  Req,
} from '@nestjs/common'
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { EstadoPeriodo } from '@prisma/client'
import { PeriodosContablesService } from './periodos-contables.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import { RoleGuard } from '../auth/guards/role.guard'
import { Rol } from '../common/decorators/role.decorator'

@ApiTags('Periodos Contables')
@Controller('periodos-contables')
export class PeriodosContablesController {
  constructor(
    private readonly periodosContablesService: PeriodosContablesService,
  ) {}

  @ApiOperation({ summary: 'Listar periodos contables' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'empresaId', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoPeriodo })
  @Get()
  async listarPeriodos(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
    @Query('empresaId', new DefaultValuePipe('1'), ParseIntPipe)
    empresaId: number,
    @Query('estado') estado?: EstadoPeriodo,
  ) {
    return this.periodosContablesService.listarPeriodos(
      page,
      limit,
      empresaId,
      estado,
    )
  }

  @ApiOperation({ summary: 'Cerrar periodo contable' })
  @ApiParam({ name: 'id', description: 'ID del periodo', type: Number })
  @ApiQuery({
    name: 'empresaId',
    description: 'ID de la empresa',
    type: Number,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RoleGuard)
  @Rol('CONTADOR')
  @Patch(':id/cerrar')
  async cerrarPeriodo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.periodosContablesService.bloquearPeriodo(id, empresaId)
  }

  @ApiOperation({ summary: 'Reabrir periodo contable' })
  @ApiParam({ name: 'id', description: 'ID del periodo', type: Number })
  @ApiQuery({
    name: 'empresaId',
    description: 'ID de la empresa',
    type: Number,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RoleGuard)
  @Rol('ADMIN')
  @Patch(':id/abrir')
  async abrirPeriodo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.periodosContablesService.desbloquearPeriodo(id, empresaId)
  }

  @ApiOperation({ summary: 'Crear periodo contable' })
  @ApiQuery({
    name: 'empresaId',
    description: 'ID de la empresa',
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Enero 2024' },
        fechaInicio: { type: 'string', format: 'date', example: '2024-01-01' },
        fechaFin: { type: 'string', format: 'date', example: '2024-01-31' },
      },
    },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RoleGuard)
  @Rol('CONTADOR')
  @Post()
  async crearPeriodo(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() data: any,
  ) {
    return this.periodosContablesService.crearPeriodo(empresaId, data)
  }

  @ApiOperation({ summary: 'Cierre contable formal (genera asiento de cierre + bloquea período)' })
  @ApiParam({ name: 'id', description: 'ID del periodo', type: Number })
  @ApiQuery({ name: 'empresaId', description: 'ID de la empresa', type: Number })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RoleGuard)
  @Rol('ADMIN')
  @Post(':id/cierre-formal')
  async cierreFormal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Req() req: any,
  ) {
    return this.periodosContablesService.cierreFormal(id, empresaId, req.user.id)
  }
}
