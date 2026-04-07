import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { EstadoAsiento, PrismaClient } from '@prisma/client'

@Injectable()
export class AsientosService {
	constructor(private readonly prisma: PrismaClient) {}

	async listarAsientos(
		page: number,
		limit: number,
		estado?: EstadoAsiento,
		periodoId?: number,
		creadoPorId?: number,
		fechaInicio?: Date,
		fechaFin?: Date,
	) {
		const skip = (page - 1) * limit

		const where = {
			...(estado ? { estado } : {}),
			...(periodoId ? { periodoId } : {}),
			...(creadoPorId ? { creadoPorId } : {}),
			...(fechaInicio || fechaFin
				? {
						fecha: {
							...(fechaInicio ? { gte: fechaInicio } : {}),
							...(fechaFin ? { lte: fechaFin } : {}),
						},
					}
				: {}),
		}

		const [total, data] = await Promise.all([
			this.prisma.asiento.count({ where }),
			this.prisma.asiento.findMany({
				where,
				orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
				skip,
				take: limit,
				include: {
					periodo: true,
					creadoPor: {
						select: { ID: true, NOMBRE: true, APELLIDO: true, ROL: true },
					},
					aprobadoPor: {
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

	async obtenerAsientoConDetalles(id: number) {
		const asiento = await this.prisma.asiento.findUnique({
			where: { id },
			include: {
				periodo: true,
				creadoPor: {
					select: { ID: true, NOMBRE: true, APELLIDO: true, ROL: true },
				},
				aprobadoPor: {
					select: { ID: true, NOMBRE: true, APELLIDO: true, ROL: true },
				},
				detallesAsiento: {
					orderBy: { no: 'asc' },
					include: {
						cuenta: true,
					},
				},
			},
		})

		if (!asiento) {
			throw new NotFoundException('Asiento no encontrado')
		}

		return asiento
	}

	async eliminarAsiento(id: number) {
		const asiento = await this.prisma.asiento.findUnique({
			where: { id },
			include: { periodo: true },
		})

		if (!asiento) {
			throw new NotFoundException('Asiento no encontrado')
		}

		if (asiento.periodo.estado === 'CERRADO') {
			throw new BadRequestException(
				'No se puede eliminar un asiento de un periodo cerrado',
			)
		}

		if (asiento.estado !== 'PENDIENTE') {
			throw new BadRequestException(
				'Solo se pueden eliminar asientos en estado PENDIENTE',
			)
		}

		await this.prisma.$transaction([
			this.prisma.detalleAsiento.deleteMany({ where: { asientoId: id } }),
			this.prisma.facturaAsiento.deleteMany({ where: { asientoId: id } }),
			this.prisma.abonos.updateMany({
				where: { asientoId: id },
				data: { asientoId: null },
			}),
			this.prisma.asiento.delete({ where: { id } }),
		])

		return { message: 'Asiento eliminado correctamente' }
	}
}
