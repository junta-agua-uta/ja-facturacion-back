import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PlanCuentasService {
	constructor(private readonly prisma: PrismaClient) {}

	async listarCuentas(
		page: number,
		limit: number,
		formato: 'plano' | 'arbol',
		empresaId: number,
	) {
		if (formato === 'arbol') {
			const cuentas = await this.prisma.planCuentas.findMany({
				where: { empresaId, activo: true },
				orderBy: { codigo: 'asc' },
			})

			const nodos = new Map(
				cuentas.map((cuenta) => [cuenta.id, { ...cuenta, hijas: [] as any[] }]),
			)

			const arbol: any[] = []
			for (const cuenta of cuentas) {
				const nodo = nodos.get(cuenta.id)
				if (!nodo) continue

				if (cuenta.padreId && nodos.has(cuenta.padreId)) {
					nodos.get(cuenta.padreId)?.hijas.push(nodo)
				} else {
					arbol.push(nodo)
				}
			}

			return {
				formato,
				total: cuentas.length,
				data: arbol,
			}
		}

		const skip = (page - 1) * limit

		const [total, data] = await Promise.all([
			this.prisma.planCuentas.count({ where: { empresaId, activo: true } }),
			this.prisma.planCuentas.findMany({
				where: { empresaId, activo: true },
				orderBy: { codigo: 'asc' },
				skip,
				take: limit,
			}),
		])

		return {
			formato,
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
			data,
		}
	}

	async buscarCuenta(termino: string, empresaId: number, limit: number) {
		return this.prisma.planCuentas.findMany({
			where: {
				empresaId,
				activo: true,
				esDetalle: true,
				OR: [
					{ codigo: { contains: termino } },
					{ nombre: { contains: termino } },
				],
			},
			orderBy: { codigo: 'asc' },
			take: limit,
		})
	}
}
