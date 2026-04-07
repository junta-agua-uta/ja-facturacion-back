import { EstadoPeriodo, PrismaClient } from '@prisma/client'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PeriodosContablesService {
	constructor(private readonly prisma: PrismaClient) {}

	async listarPeriodos(
		page: number,
		limit: number,
		empresaId: number,
		estado?: EstadoPeriodo,
	) {
		const skip = (page - 1) * limit

		const where = {
			empresaId,
			...(estado ? { estado } : {}),
		}

		const [total, data] = await Promise.all([
			this.prisma.periodoContable.count({ where }),
			this.prisma.periodoContable.findMany({
				where,
				orderBy: { fechaInicio: 'desc' },
				skip,
				take: limit,
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
