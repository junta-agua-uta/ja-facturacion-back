import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { CreatePlanCuentaDto } from './dtos/create-plan-cuenta.dto'

@Injectable()
export class PlanCuentasService {
	constructor(private readonly prisma: PrismaClient) { }

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

	async crearCuenta(empresaId: number, data: CreatePlanCuentaDto) {
		const cuentaExistente = await this.prisma.planCuentas.findUnique({
			where: {
				empresaId_codigo: {
					empresaId: empresaId,
					codigo: data.codigo,
				},
			},
		})

		if (cuentaExistente) {
			throw new BadRequestException(`El código de cuenta ${data.codigo} ya existe en esta empresa.`)
		}

		let nivelCalculado = 1
		let tipoFinal = data.tipo
		let naturalezaFinal = data.naturaleza

		if (data.padreId) {
			const cuentaPadre = await this.prisma.planCuentas.findUnique({
				where: { id: data.padreId },
			})

			if (!cuentaPadre) {
				throw new BadRequestException('La cuenta padre especificada no existe.')
			}

			if (!data.codigo.startsWith(cuentaPadre.codigo)) {
				throw new BadRequestException(
					`Inconsistencia: El código de la subcuenta (${data.codigo}) debe iniciar con el código de su cuenta padre (${cuentaPadre.codigo}).`
				)
			}

			nivelCalculado = cuentaPadre.nivel + 1
			tipoFinal = cuentaPadre.tipo
			naturalezaFinal = cuentaPadre.naturaleza

			if (cuentaPadre.esDetalle) {
				const asientosAsociados = await this.prisma.detalleAsiento.count({
					where: { cuentaId: cuentaPadre.id },
				})

				if (asientosAsociados > 0) {
					throw new BadRequestException(
						'Vulnerabilidad detectada: No se puede crear subcuentas bajo una cuenta transaccional que ya posee historial de asientos contables. Reasigne esos asientos previamente.'
					)
				}

				await this.prisma.planCuentas.update({
					where: { id: cuentaPadre.id },
					data: { esDetalle: false },
				})
			}
		}

		const nuevaCuenta = await this.prisma.planCuentas.create({
			data: {
				codigo: data.codigo,
				nombre: data.nombre,
				tipo: tipoFinal,
				naturaleza: naturalezaFinal,
				casillero: data.casillero,
				nivel: nivelCalculado,
				esDetalle: true,
				padreId: data.padreId || null,
				empresaId: empresaId,
			},
		})

		return nuevaCuenta
	}

	async desactivarCuenta(cuentaId: number, empresaId: number) {
		const cuenta = await this.prisma.planCuentas.findUnique({
			where: { id: cuentaId },
			include: {
				hijas: { where: { activo: true } },
			},
		})

		if (!cuenta || cuenta.empresaId !== empresaId) {
			throw new BadRequestException('La cuenta especificada no existe o no pertenece a esta empresa.')
		}

		if (cuenta.hijas.length > 0) {
			throw new BadRequestException('Imposible desactivar: La cuenta posee subcuentas que aún están activas.')
		}

		const usoEnAsientos = await this.prisma.detalleAsiento.findFirst({
			where: { 
				cuentaId,
				asiento: { estado: 'PENDIENTE' }
			},
		})

		if (usoEnAsientos) {
			throw new BadRequestException('Imposible desactivar: La cuenta posee asientos contables en estado PENDIENTE.')
		}

		return this.prisma.planCuentas.update({
			where: { id: cuentaId },
			data: { activo: false },
		})
	}
}
