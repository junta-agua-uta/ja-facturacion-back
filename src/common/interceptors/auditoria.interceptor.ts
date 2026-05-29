import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
	Logger,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { AuditoriaService } from '../services/auditoria.service'

/**
 * Interceptor global que registra todas las peticiones que modifican datos
 * (POST, PUT, PATCH, DELETE) en la bitácora de auditoría.
 */
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
	private readonly logger = new Logger(AuditoriaInterceptor.name)

	constructor(private readonly auditoriaService: AuditoriaService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest()
		const method = request.method
		const url = request.url
		const user = request.user

		// Solo auditar operaciones de escritura
		if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
			return next.handle()
		}

		// Extraer info relevante
		const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown'
		const userAgent = request.headers['user-agent'] || 'unknown'
		const body = request.body

		// Determinar entidad desde la URL (ej: /apiV2/asientos/5/aprobar → entidad=asientos)
		const urlParts = url.replace(/^\/apiV2\//, '').split('/')
		const entidad = urlParts[0] || 'desconocido'
		const entidadId = parseInt(urlParts[1]) || 0

		// Determinar acción
		const accionExtra = urlParts.slice(2).join('/') // ej: "aprobar", "cerrar"
		const accion = `${method} ${entidad}${accionExtra ? '/' + accionExtra : ''}`

		return next.handle().pipe(
			tap({
				next: (responseData) => {
					if (user?.id) {
						this.auditoriaService.registrar({
							usuarioId: user.id,
							accion,
							entidad,
							entidadId,
							datosPrevios: undefined,
							datosNuevos: this.sanitizarBody(body),
							ip: String(ip),
							userAgent: String(userAgent),
						}).catch(() => {
							// Silenciar errores de auditoría
						})
					}
				},
				error: (error) => {
					if (user?.id) {
						this.auditoriaService.registrar({
							usuarioId: user.id,
							accion: `${accion} [ERROR: ${error.message}]`,
							entidad,
							entidadId,
							datosPrevios: undefined,
							datosNuevos: this.sanitizarBody(body),
							ip: String(ip),
							userAgent: String(userAgent),
						}).catch(() => {
							// Silenciar errores de auditoría
						})
					}
				},
			}),
		)
	}

	/**
	 * Limpia datos sensibles del body antes de guardar en auditoría.
	 */
	private sanitizarBody(body: any): any {
		if (!body || typeof body !== 'object') return body

		const sanitizado = { ...body }
		const camposSensibles = ['password', 'hash', 'salt', 'token', 'HASH', 'SALT']
		camposSensibles.forEach((campo) => {
			if (sanitizado[campo]) {
				sanitizado[campo] = '[REDACTED]'
			}
		})

		return sanitizado
	}
}
