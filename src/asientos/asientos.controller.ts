import {
	Controller,
	DefaultValuePipe,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Body,
	Query,
	Patch,
	UseGuards,
	Req,
	Res,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { EstadoAsiento } from '@prisma/client'
import { AsientosService } from './asientos.service'
import { AsientoAutomaticoService } from './asiento-automatico.service'
import { CreateAsientoDto } from './dto/create-asiento.dto'
import { AuthGuard } from '../auth/guards/auth.guard'
import { RoleGuard } from '../auth/guards/role.guard'
import { Rol } from '../common/decorators/role.decorator'
import { AsientoPdfService } from './services/asiento-pdf.service'
import { Response } from 'express'

@ApiTags('Asientos')
@Controller('asientos')
export class AsientosController {
	constructor(
		private readonly asientosService: AsientosService,
		private readonly asientoAutomaticoService: AsientoAutomaticoService,
		private readonly asientoPdfService: AsientoPdfService,
	) {}

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

	@ApiOperation({ summary: 'Crear un nuevo asiento contable' })
	@ApiBody({ type: CreateAsientoDto })
	@Post()
	async crearAsiento(@Body() data: CreateAsientoDto) {
		return this.asientosService.crearAsiento(data)
	}

	@ApiOperation({ summary: 'Actualizar un asiento borrador existente' })
	@Patch(':id')
	async actualizarAsiento(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: any,
	) {
		return this.asientosService.actualizarAsiento(id, data)
	}

	@ApiOperation({ summary: 'Aprobar múltiples asientos en lote (solo CONTADOR)' })
	@ApiBearerAuth('access-token')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				asientoIds: {
					type: 'array',
					items: { type: 'number' },
					example: [1, 2, 3],
					description: 'IDs de los asientos a aprobar',
				},
			},
		},
	})
	@UseGuards(AuthGuard, RoleGuard)
	@Rol('CONTADOR')
	@Patch('aprobar-lote')
	async aprobarAsientosEnLote(
		@Body() body: { asientoIds: number[] },
		@Req() req: any,
	) {
		return this.asientosService.aprobarAsientosEnLote(body.asientoIds, req.user.id)
	}

	@ApiOperation({ summary: 'Aprobar un asiento contable (solo CONTADOR)' })
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard, RoleGuard)
	@Rol('CONTADOR')
	@Patch(':id/aprobar')
	async aprobarAsiento(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: any,
	) {
		return this.asientosService.aprobarAsiento(id, req.user.id)
	}

	@ApiOperation({ summary: 'Agrupar facturas del día en un solo asiento' })
	@ApiBearerAuth('access-token')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				fecha: { type: 'string', format: 'date', example: '2024-06-15' },
				empresaId: { type: 'number', example: 1 },
			},
		},
	})
	@UseGuards(AuthGuard, RoleGuard)
	@Rol('CONTADOR')
	@Post('agrupar/dia')
	async agruparPorDia(@Body() body: { fecha: string; empresaId?: number }, @Req() req: any) {
		return this.asientoAutomaticoService.agruparAsientosPorDia(
			new Date(body.fecha),
			body.empresaId || 1,
			req.user.id,
		)
	}

	@ApiOperation({ summary: 'Agrupar facturas de un cliente en un solo asiento' })
	@ApiBearerAuth('access-token')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				clienteId: { type: 'number', example: 1 },
				empresaId: { type: 'number', example: 1 },
				fechaInicio: { type: 'string', format: 'date', example: '2024-01-01' },
				fechaFin: { type: 'string', format: 'date', example: '2024-12-31' },
			},
		},
	})
	@UseGuards(AuthGuard, RoleGuard)
	@Rol('CONTADOR')
	@Post('agrupar/cliente')
	async agruparPorCliente(
		@Body() body: { clienteId: number; empresaId?: number; fechaInicio?: string; fechaFin?: string },
		@Req() req: any,
	) {
		return this.asientoAutomaticoService.agruparAsientosPorCliente(
			body.clienteId,
			body.empresaId || 1,
			req.user.id,
			body.fechaInicio ? new Date(body.fechaInicio) : undefined,
			body.fechaFin ? new Date(body.fechaFin) : undefined,
		)
	}

	@ApiOperation({ summary: 'Agrupar facturas de un período contable en un solo asiento' })
	@ApiBearerAuth('access-token')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				periodoId: { type: 'number', example: 1 },
				empresaId: { type: 'number', example: 1 },
			},
		},
	})
	@UseGuards(AuthGuard, RoleGuard)
	@Rol('CONTADOR')
	@Post('agrupar/periodo')
	async agruparPorPeriodo(
		@Body() body: { periodoId: number; empresaId?: number },
		@Req() req: any,
	) {
		return this.asientoAutomaticoService.agruparAsientosPorPeriodo(
			body.periodoId,
			body.empresaId || 1,
			req.user.id,
		)
	}

	@ApiOperation({ summary: 'Descargar comprobante de diario (Asiento) en PDF' })
	@ApiQuery({ name: 'empresaId', required: false, type: Number })
	@Get(':id/pdf')
	async descargarPdf(
		@Param('id', ParseIntPipe) id: number,
		@Query('empresaId', new DefaultValuePipe('1'), ParseIntPipe) empresaId: number,
		@Res() res: Response,
	) {
		const buffer = await this.asientoPdfService.generarPdfAsiento(id, empresaId);
		res.set({
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="comprobante_diario_${id}.pdf"`,
			'Content-Length': buffer.length,
		});
		res.end(buffer);
	}
}
