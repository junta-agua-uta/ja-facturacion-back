import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { EstadoAsiento, PrismaClient } from '@prisma/client'
import { CreateAsientoDto } from './dto/create-asiento.dto'

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
			this.prisma.aBONOS.updateMany({
				where: { asientoId: id },
				data: { asientoId: null },
			}),
			this.prisma.asiento.delete({ where: { id } }),
		])

		return { message: 'Asiento eliminado correctamente' }
	}

	async crearAsiento(data: CreateAsientoDto) {
		const periodo = await this.prisma.periodoContable.findUnique({
			where: { id: data.periodoId },
		})

		if (!periodo) {
			throw new NotFoundException('Periodo contable no encontrado')
		}

		if (periodo.estado === 'CERRADO') {
			throw new BadRequestException('Intento de inserción bloqueado: El periodo contable ingresado se encuentra CERRADO.')
		}

		const fechaInsercion = new Date(data.fecha)
		if (fechaInsercion < periodo.fechaInicio || fechaInsercion > periodo.fechaFin) {
			throw new BadRequestException(
				`Inconsistencia temporal: La fecha del asiento (${fechaInsercion.toISOString().split('T')[0]}) no pertenece a las fechas del periodo contable.`
			)
		}

		const cuentaIds = [...new Set(data.detalles.map((d) => d.cuentaId))]
		const cuentas = await this.prisma.planCuentas.findMany({
			where: { id: { in: cuentaIds } },
		})

		if (cuentas.length !== cuentaIds.length) {
			throw new BadRequestException('Una o más cuentas contables no existen en la base de datos.')
		}

		const cuentasMayores = cuentas.filter((c) => !c.esDetalle)
		if (cuentasMayores.length > 0) {
			throw new BadRequestException(
				`Violación de jerarquía detectada: Las cuentas mayores [${cuentasMayores.map((c) => c.codigo).join(', ')}] no pueden recibir saldos. Debe imputar a una cuenta hija de detalle (esDetalle: true).`
			)
		}

		let totalDebe = 0
		let totalHaber = 0

		data.detalles.forEach((det) => {
			totalDebe += Number(det.debe)
			totalHaber += Number(det.haber)
		})

		// Precisión a dos decimales
		const descuadreBase = Math.abs(totalDebe - totalHaber)
		const descuadre = Math.round(descuadreBase * 100) / 100

		const ultimoAsiento = await this.prisma.asiento.findFirst({
			where: { periodoId: data.periodoId },
			orderBy: { numero: 'desc' },
		})

		const siguienteNumero = ultimoAsiento ? ultimoAsiento.numero + 1 : 1

		return this.prisma.asiento.create({
			data: {
				numero: siguienteNumero,
				fecha: new Date(data.fecha),
				nombre: `Asiento Diario #${siguienteNumero} - ${periodo.nombre}`,
				concepto: data.concepto,
				modelo: data.modelo,
				comprobante: data.comprobante,
				descuadre: descuadre,
				estado: 'PENDIENTE', 
				periodoId: data.periodoId,
				creadoPorId: data.creadoPorId,
				detallesAsiento: {
					create: data.detalles.map((det, index) => {
						const cta = cuentas.find((c) => c.id === det.cuentaId)!
						return {
							no: index + 1,
							codcta: cta.codigo,
							nombre: cta.nombre,
							referencia: det.referencia,
							descta: det.descta,
							debe: det.debe,
							haber: det.haber,
							cuentaId: det.cuentaId,
						}
					}),
				},
			},
			include: {
				detallesAsiento: true,
			},
		})
	}

	async actualizarAsiento(asientoId: number, data: any) {
		const asientoOriginal = await this.prisma.asiento.findUnique({
			where: { id: asientoId },
			include: { periodo: true }
		})

		if (!asientoOriginal) {
			throw new NotFoundException('Asiento contable no encontrado.')
		}

		if (asientoOriginal.periodo.estado === 'CERRADO') {
			throw new BadRequestException('Acción denegada: No se puede modificar una transacción de un periodo contable ya cerrado.')
		}

		if (asientoOriginal.estado === 'APROBADO') {
			throw new BadRequestException('Seguridad: El asiento contable está APROBADO y blindado. Solo comprobantes en estado PENDIENTE admiten edición.')
		}

		let nuevoDescuadre: any = asientoOriginal.descuadre

		return this.prisma.$transaction(async (tx) => {
			if (data.detalles && Array.isArray(data.detalles) && data.detalles.length > 0) {
				const cuentaIds: number[] = Array.from(new Set(data.detalles.map((d: any) => Number(d.cuentaId))))
				const cuentas = await tx.planCuentas.findMany({
					where: { id: { in: cuentaIds } },
				})

				if (cuentas.length !== cuentaIds.length) {
					throw new BadRequestException('Una o más cuentas contables proporcionadas no existen en la base de datos.')
				}

				const cuentasMayores = cuentas.filter((c) => !c.esDetalle)
				if (cuentasMayores.length > 0) {
					throw new BadRequestException(
						`Violación de jerarquía detectada: Las cuentas mayores [${cuentasMayores.map((c) => c.codigo).join(', ')}] no pueden recibir saldos.`
					)
				}

				let totalDebe = 0
				let totalHaber = 0
				data.detalles.forEach((det: any) => {
					totalDebe += Number(det.debe)
					totalHaber += Number(det.haber)
				})

				const descuadreBase = Math.abs(totalDebe - totalHaber)
				nuevoDescuadre = Math.round(descuadreBase * 100) / 100

				await tx.detalleAsiento.deleteMany({
					where: { asientoId },
				})

				await tx.detalleAsiento.createMany({
					data: data.detalles.map((det: any, index: number) => {
						const cta = cuentas.find((c) => c.id === det.cuentaId)!
						return {
							asientoId,
							no: index + 1,
							codcta: cta.codigo,
							nombre: cta.nombre,
							referencia: det.referencia,
							descta: det.descta,
							debe: det.debe,
							haber: det.haber,
							cuentaId: det.cuentaId,
						}
					}),
				})
			}

			const fechaInsercion = data.fecha ? new Date(data.fecha) : asientoOriginal.fecha
			if (data.fecha) {
				if (fechaInsercion < asientoOriginal.periodo.fechaInicio || fechaInsercion > asientoOriginal.periodo.fechaFin) {
					throw new BadRequestException(
						`Inconsistencia temporal: La fecha del asiento no pertenece a las fechas del periodo contable.`
					)
				}
			}

			return tx.asiento.update({
				where: { id: asientoId },
				data: {
					fecha: fechaInsercion,
					concepto: data.concepto !== undefined ? data.concepto : asientoOriginal.concepto,
					modelo: data.modelo !== undefined ? data.modelo : asientoOriginal.modelo,
					comprobante: data.comprobante !== undefined ? data.comprobante : asientoOriginal.comprobante,
					descuadre: nuevoDescuadre,
				},
				include: { detallesAsiento: true },
			})
		})
	}
}
