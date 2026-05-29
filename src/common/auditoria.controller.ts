import {
	Controller,
	DefaultValuePipe,
	Get,
	ParseIntPipe,
	Query,
	UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../auth/guards/auth.guard'
import { RoleGuard } from '../auth/guards/role.guard'
import { Rol } from '../common/decorators/role.decorator'
import { AuditoriaService } from '../common/services/auditoria.service'

@ApiTags('Auditoría')
@Controller('auditoria')
export class AuditoriaController {
	constructor(private readonly auditoriaService: AuditoriaService) {}

	@ApiOperation({ summary: 'Consultar bitácora de auditoría (solo ADMIN)' })
	@ApiBearerAuth('access-token')
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiQuery({ name: 'usuarioId', required: false, type: Number })
	@ApiQuery({ name: 'entidad', required: false, type: String })
	@ApiQuery({ name: 'accion', required: false, type: String })
	@ApiQuery({ name: 'fechaInicio', required: false, type: String })
	@ApiQuery({ name: 'fechaFin', required: false, type: String })
	@UseGuards(AuthGuard, RoleGuard)
	@Rol('ADMIN')
	@Get()
	async consultarLogs(
		@Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe('20'), ParseIntPipe) limit: number,
		@Query('usuarioId') usuarioId?: string,
		@Query('entidad') entidad?: string,
		@Query('accion') accion?: string,
		@Query('fechaInicio') fechaInicio?: string,
		@Query('fechaFin') fechaFin?: string,
	) {
		return this.auditoriaService.consultarLogs(page, limit, {
			usuarioId: usuarioId ? Number(usuarioId) : undefined,
			entidad,
			accion,
			fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
			fechaFin: fechaFin ? new Date(fechaFin) : undefined,
		})
	}
}
