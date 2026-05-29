import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

export interface DatosAuditoria {
	usuarioId: number
	accion: string
	entidad: string
	entidadId: number
	datosPrevios?: any
	datosNuevos?: any
	ip?: string
	userAgent?: string
}

@Injectable()
export class AuditoriaService {
	private readonly logger = new Logger(AuditoriaService.name)

	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Registra una acción en la bitácora de auditoría.
	 */
	async registrar(datos: DatosAuditoria) {
		try {
			const log = await this.prisma.auditoriaLog.create({
				data: {
					usuarioId: datos.usuarioId,
					accion: datos.accion,
					entidad: datos.entidad,
					entidadId: datos.entidadId,
					datosPrevios: datos.datosPrevios ?? undefined,
					datosNuevos: datos.datosNuevos ?? undefined,
					ip: datos.ip ?? null,
					userAgent: datos.userAgent ?? null,
				},
			})

			this.logger.log(
				`[AUDITORIA] ${datos.accion} en ${datos.entidad}#${datos.entidadId} por usuario#${datos.usuarioId}`,
			)

			return log
		} catch (error) {
			// La auditoría nunca debe bloquear la operación principal
			this.logger.error(`Error al registrar auditoría: ${error.message}`)
		}
	}

	/**
	 * Consulta los registros de auditoría con filtros y paginación.
	 */
	async consultarLogs(
		page: number,
		limit: number,
		filtros?: {
			usuarioId?: number
			entidad?: string
			accion?: string
			fechaInicio?: Date
			fechaFin?: Date
		},
	) {
		const skip = (page - 1) * limit

		const where: any = {}
		if (filtros?.usuarioId) where.usuarioId = filtros.usuarioId
		if (filtros?.entidad) where.entidad = filtros.entidad
		if (filtros?.accion) where.accion = { contains: filtros.accion }
		if (filtros?.fechaInicio || filtros?.fechaFin) {
			where.createdAt = {
				...(filtros.fechaInicio ? { gte: filtros.fechaInicio } : {}),
				...(filtros.fechaFin ? { lte: filtros.fechaFin } : {}),
			}
		}

		const [total, data] = await Promise.all([
			this.prisma.auditoriaLog.count({ where }),
			this.prisma.auditoriaLog.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
				include: {
					usuario: {
						select: { ID: true, NOMBRE: true, APELLIDO: true, ROL: true },
					},
				},
			}),
		])

		return {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
			data,
		}
	}
}
