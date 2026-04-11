import {
	Controller,
	DefaultValuePipe,
	Get,
	ParseIntPipe,
	Query,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { EstadoPeriodo } from '@prisma/client'
import { PeriodosContablesService } from './periodos-contables.service'

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
}
