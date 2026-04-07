import {
	Controller,
	DefaultValuePipe,
	Get,
	ParseIntPipe,
	Query,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { PlanCuentasService } from './plan-cuentas.service'

@ApiTags('Plan Cuentas')
@Controller('plan-cuentas')
export class PlanCuentasController {
	constructor(private readonly planCuentasService: PlanCuentasService) {}

	@ApiOperation({ summary: 'Listar cuentas en formato plano o arbol' })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiQuery({
		name: 'formato',
		required: false,
		enum: ['plano', 'arbol'],
	})
	@ApiQuery({ name: 'empresaId', required: false, type: Number })
	@Get()
	async listarCuentas(
		@Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
		@Query('formato', new DefaultValuePipe('plano')) formato: 'plano' | 'arbol',
		@Query('empresaId', new DefaultValuePipe('1'), ParseIntPipe)
		empresaId: number,
	) {
		return this.planCuentasService.listarCuentas(page, limit, formato, empresaId)
	}

	@ApiOperation({ summary: 'Buscar cuentas detalle por codigo o nombre' })
	@ApiQuery({ name: 'q', required: true, type: String })
	@ApiQuery({ name: 'empresaId', required: false, type: Number })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@Get('buscar')
	async buscarCuenta(
		@Query('q') termino: string,
		@Query('empresaId', new DefaultValuePipe('1'), ParseIntPipe)
		empresaId: number,
		@Query('limit', new DefaultValuePipe('20'), ParseIntPipe) limit: number,
	) {
		return this.planCuentasService.buscarCuenta(termino, empresaId, limit)
	}
}
