import {
	Controller,
	DefaultValuePipe,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Query,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { EstadoAsiento } from '@prisma/client'
import { AsientosService } from './asientos.service'

@ApiTags('Asientos')
@Controller('asientos')
export class AsientosController {
	constructor(private readonly asientosService: AsientosService) {}

	@ApiOperation({ summary: 'Listar asientos con filtros' })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiQuery({ name: 'estado', required: false, enum: EstadoAsiento })
	@ApiQuery({ name: 'periodoId', required: false, type: Number })
	@ApiQuery({ name: 'creadoPorId', required: false, type: Number })
	@ApiQuery({ name: 'fechaInicio', required: false, type: String })
	@ApiQuery({ name: 'fechaFin', required: false, type: String })
	@Get()
	async listarAsientos(
		@Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
		@Query('estado') estado?: EstadoAsiento,
		@Query('periodoId') periodoId?: string,
		@Query('creadoPorId') creadoPorId?: string,
		@Query('fechaInicio') fechaInicio?: string,
		@Query('fechaFin') fechaFin?: string,
	) {
		return this.asientosService.listarAsientos(
			page,
			limit,
			estado,
			periodoId ? Number(periodoId) : undefined,
			creadoPorId ? Number(creadoPorId) : undefined,
			fechaInicio ? new Date(fechaInicio) : undefined,
			fechaFin ? new Date(fechaFin) : undefined,
		)
	}

	@ApiOperation({ summary: 'Obtener asiento con detalles' })
	@Get(':id')
	async obtenerAsiento(@Param('id', ParseIntPipe) id: number) {
		return this.asientosService.obtenerAsientoConDetalles(id)
	}

	@ApiOperation({ summary: 'Eliminar asiento' })
	@Delete(':id')
	async eliminarAsiento(@Param('id', ParseIntPipe) id: number) {
		return this.asientosService.eliminarAsiento(id)
	}
}
