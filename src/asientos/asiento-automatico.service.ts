import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * Datos de la transacción que genera el asiento automático.
 */
export interface DatosTransaccion {
	/** Tipo de transacción: 'FACTURA_VENTA', 'ABONO', etc. */
	tipoTransaccion: string
	/** ID de la empresa */
	empresaId: number
	/** ID del usuario que genera la transacción */
	usuarioId: number
	/** Fecha de la transacción */
	fecha: Date
	/** Monto base (sin impuestos) */
	montoBase: number
	/** Monto del IVA */
	montoIva: number
	/** Monto total */
	montoTotal: number
	/** Descripción/concepto del asiento */
	concepto: string
	/** Referencia al documento origen (ej: "FAC-001-001-000000123") */
	referencia?: string
	/** ID de la factura (para registrar en FacturaAsiento) */
	facturaId?: number
	/** ID del abono (para vincular con ABONOS.asientoId) */
	abonoId?: number
}

@Injectable()
export class AsientoAutomaticoService {
	private readonly logger = new Logger(AsientoAutomaticoService.name)

	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Genera un asiento contable automáticamente a partir de una transacción.
	 *
	 * Flujo:
	 * 1. Busca la configuración contable para el tipo de transacción
	 * 2. Determina el período contable vigente
	 * 3. Construye las líneas de detalle (debe/haber)
	 * 4. Valida el cuadre (SUMA(debe) == SUMA(haber))
	 * 5. Guarda el asiento en estado PENDIENTE
	 * 6. Vincula con la factura/abono si corresponde
	 */
	async generarAsientoAutomatico(datos: DatosTransaccion) {
		// 1. Obtener configuración contable
		const config = await this.prisma.configAsientoAuto.findFirst({
			where: {
				empresaId: datos.empresaId,
				tipoTransaccion: datos.tipoTransaccion,
				activo: true,
			},
			include: {
				cuentaDebe: true,
				cuentaHaber: true,
				cuentaIva: true,
			},
		})

		if (!config) {
			throw new NotFoundException(
				`No existe configuración contable activa para el tipo de transacción "${datos.tipoTransaccion}". ` +
				`Configure las cuentas contables en /config-asientos-auto antes de continuar.`,
			)
		}

		// 2. Determinar período contable vigente
		const periodo = await this.prisma.periodoContable.findFirst({
			where: {
				empresaId: datos.empresaId,
				estado: 'ABIERTO',
				fechaInicio: { lte: datos.fecha },
				fechaFin: { gte: datos.fecha },
			},
		})

		if (!periodo) {
			throw new BadRequestException(
				`No existe un período contable ABIERTO que incluya la fecha ${datos.fecha.toISOString().split('T')[0]}. ` +
				`Cree o abra un período contable que cubra esta fecha.`,
			)
		}

		// 3. Construir líneas de detalle
		const detalles = this.construirDetalles(datos, config)

		// 4. Validar cuadre
		let totalDebe = 0
		let totalHaber = 0
		detalles.forEach((d) => {
			totalDebe += d.debe
			totalHaber += d.haber
		})

		const descuadre = Math.round(Math.abs(totalDebe - totalHaber) * 100) / 100
		if (descuadre > 0.01) {
			this.logger.error(
				`Asiento descuadrado para ${datos.tipoTransaccion}: Debe=${totalDebe}, Haber=${totalHaber}, Descuadre=${descuadre}`,
			)
			throw new BadRequestException(
				`Error interno de cuadre: El asiento automático generado tiene un descuadre de $${descuadre.toFixed(2)}. Revise la configuración contable.`,
			)
		}

		// 5. Obtener siguiente número de asiento en el período
		const ultimoAsiento = await this.prisma.asiento.findFirst({
			where: { periodoId: periodo.id },
			orderBy: { numero: 'desc' },
		})
		const siguienteNumero = ultimoAsiento ? ultimoAsiento.numero + 1 : 1

		// 6. Crear asiento con detalles en una transacción
		const asiento = await this.prisma.$transaction(async (tx) => {
			const nuevoAsiento = await tx.asiento.create({
				data: {
					numero: siguienteNumero,
					fecha: datos.fecha,
					nombre: `Asiento Automático #${siguienteNumero} - ${periodo.nombre}`,
					concepto: datos.concepto,
					modelo: 'AUTOMATICO',
					comprobante: datos.referencia || null,
					descuadre: descuadre,
					estado: 'PENDIENTE',
					periodoId: periodo.id,
					creadoPorId: datos.usuarioId,
					detallesAsiento: {
						create: detalles.map((det, index) => ({
							no: index + 1,
							codcta: det.codcta,
							nombre: det.nombre,
							referencia: datos.referencia || null,
							descta: det.descta,
							debe: det.debe,
							haber: det.haber,
							cuentaId: det.cuentaId,
						})),
					},
				},
				include: {
					detallesAsiento: true,
					periodo: true,
				},
			})

			// 7. Vincular con factura si corresponde
			if (datos.facturaId) {
				await tx.facturaAsiento.create({
					data: {
						facturaId: datos.facturaId,
						asientoId: nuevoAsiento.id,
						tipoRelacion: 'AUTOMATICO',
					},
				})
			}

			// 8. Vincular con abono si corresponde
			if (datos.abonoId) {
				await tx.aBONOS.update({
					where: { ID: datos.abonoId },
					data: { asientoId: nuevoAsiento.id },
				})
			}

			return nuevoAsiento
		})

		this.logger.log(
			`Asiento automático #${asiento.numero} generado para ${datos.tipoTransaccion} ` +
			`(ID: ${asiento.id}, Período: ${periodo.nombre})`,
		)

		return asiento
	}

	/**
	 * Construye las líneas de detalle del asiento según el tipo de transacción.
	 *
	 * Para FACTURA_VENTA:
	 *   DEBE: CxC (total)
	 *   HABER: Ingreso (base sin impuestos)
	 *   HABER: IVA por Pagar (iva)  — solo si hay IVA y cuenta configurada
	 *
	 * Para ABONO:
	 *   DEBE: Caja/Banco (valor del abono)
	 *   HABER: CxC (valor del abono)
	 */
	private construirDetalles(
		datos: DatosTransaccion,
		config: any,
	): {
		codcta: string
		nombre: string
		descta: string
		debe: number
		haber: number
		cuentaId: number
	}[] {
		const detalles: {
			codcta: string
			nombre: string
			descta: string
			debe: number
			haber: number
			cuentaId: number
		}[] = []

		switch (datos.tipoTransaccion) {
			case 'FACTURA_VENTA': {
				// DEBE: Cuentas por Cobrar = Total de la factura
				detalles.push({
					codcta: config.cuentaDebe.codigo,
					nombre: config.cuentaDebe.nombre,
					descta: `CxC - ${datos.concepto}`,
					debe: datos.montoTotal,
					haber: 0,
					cuentaId: config.cuentaDebeId,
				})

				// HABER: Ingreso por venta = Subtotal sin impuestos
				detalles.push({
					codcta: config.cuentaHaber.codigo,
					nombre: config.cuentaHaber.nombre,
					descta: `Ingreso - ${datos.concepto}`,
					debe: 0,
					haber: datos.montoBase,
					cuentaId: config.cuentaHaberId,
				})

				// HABER: IVA por Pagar (si hay IVA y cuenta configurada)
				if (datos.montoIva > 0 && config.cuentaIva) {
					detalles.push({
						codcta: config.cuentaIva.codigo,
						nombre: config.cuentaIva.nombre,
						descta: `IVA - ${datos.concepto}`,
						debe: 0,
						haber: datos.montoIva,
						cuentaId: config.cuentaIvaId,
					})
				}
				break
			}

			case 'ABONO': {
				// DEBE: Caja/Banco = Valor del abono
				detalles.push({
					codcta: config.cuentaDebe.codigo,
					nombre: config.cuentaDebe.nombre,
					descta: `Cobro - ${datos.concepto}`,
					debe: datos.montoTotal,
					haber: 0,
					cuentaId: config.cuentaDebeId,
				})

				// HABER: CxC = Valor del abono
				detalles.push({
					codcta: config.cuentaHaber.codigo,
					nombre: config.cuentaHaber.nombre,
					descta: `Abono CxC - ${datos.concepto}`,
					debe: 0,
					haber: datos.montoTotal,
					cuentaId: config.cuentaHaberId,
				})
				break
			}

			default:
				throw new BadRequestException(
					`Tipo de transacción "${datos.tipoTransaccion}" no tiene reglas contables definidas. ` +
					`Tipos soportados: FACTURA_VENTA, ABONO.`,
				)
		}

		return detalles
	}

	/**
	 * Agrupa todas las facturas de un día en un solo asiento contable.
	 * Tarea 2.1.2 del plan.
	 */
	async agruparAsientosPorDia(fecha: Date, empresaId: number, usuarioId: number) {
		const inicioDia = new Date(fecha)
		inicioDia.setHours(0, 0, 0, 0)
		const finDia = new Date(fecha)
		finDia.setHours(23, 59, 59, 999)

		// Buscar facturas autorizadas del día que NO tengan asiento agrupado
		const facturas = await this.prisma.fACTURAS.findMany({
			where: {
				ESTADO_FACTURA: 'AUTORIZADO',
				FECHA_EMISION: { gte: inicioDia, lte: finDia },
				facturasAsiento: {
					none: { tipoRelacion: 'AGRUPADO' },
				},
			},
			include: { cliente: true },
		})

		if (facturas.length === 0) {
			return { message: `No hay facturas autorizadas para agrupar en la fecha ${fecha.toISOString().split('T')[0]}`, asiento: null }
		}

		// Sumar totales
		let totalBase = 0
		let totalIva = 0
		let totalGeneral = 0
		facturas.forEach((f) => {
			totalBase += f.VALOR_SIN_IMPUESTO
			totalIva += f.IVA
			totalGeneral += f.TOTAL
		})

		const fechaStr = fecha.toISOString().split('T')[0]
		const asiento = await this.generarAsientoAutomatico({
			tipoTransaccion: 'FACTURA_VENTA',
			empresaId,
			usuarioId,
			fecha,
			montoBase: totalBase,
			montoIva: totalIva,
			montoTotal: totalGeneral,
			concepto: `Agrupación diaria de ${facturas.length} facturas - ${fechaStr}`,
			referencia: `AGRUP-DIA-${fechaStr}`,
		})

		// Vincular todas las facturas con el asiento agrupado
		await this.prisma.facturaAsiento.createMany({
			data: facturas.map((f) => ({
				facturaId: f.ID,
				asientoId: asiento.id,
				tipoRelacion: 'AGRUPADO',
			})),
		})

		this.logger.log(
			`Asiento agrupado por día generado: ${facturas.length} facturas → Asiento #${asiento.numero}`,
		)

		return {
			message: `${facturas.length} facturas agrupadas en asiento #${asiento.numero}`,
			asiento,
			facturasAgrupadas: facturas.length,
		}
	}

	/**
	 * Agrupa todas las facturas de un cliente en un período en un solo asiento.
	 * Tarea 2.1.3 del plan.
	 */
	async agruparAsientosPorCliente(
		clienteId: number,
		empresaId: number,
		usuarioId: number,
		fechaInicio?: Date,
		fechaFin?: Date,
	) {
		const where: any = {
			ESTADO_FACTURA: 'AUTORIZADO',
			ID_CLIENTE: clienteId,
			facturasAsiento: {
				none: { tipoRelacion: 'AGRUPADO' },
			},
		}

		if (fechaInicio || fechaFin) {
			where.FECHA_EMISION = {
				...(fechaInicio ? { gte: fechaInicio } : {}),
				...(fechaFin ? { lte: fechaFin } : {}),
			}
		}

		const facturas = await this.prisma.fACTURAS.findMany({
			where,
			include: { cliente: true },
		})

		if (facturas.length === 0) {
			return { message: 'No hay facturas autorizadas para agrupar para este cliente', asiento: null }
		}

		let totalBase = 0
		let totalIva = 0
		let totalGeneral = 0
		facturas.forEach((f) => {
			totalBase += f.VALOR_SIN_IMPUESTO
			totalIva += f.IVA
			totalGeneral += f.TOTAL
		})

		const cliente = facturas[0].cliente
		const asiento = await this.generarAsientoAutomatico({
			tipoTransaccion: 'FACTURA_VENTA',
			empresaId,
			usuarioId,
			fecha: new Date(),
			montoBase: totalBase,
			montoIva: totalIva,
			montoTotal: totalGeneral,
			concepto: `Agrupación por cliente: ${cliente.RAZON_SOCIAL} (${facturas.length} facturas)`,
			referencia: `AGRUP-CLI-${cliente.IDENTIFICACION}`,
		})

		await this.prisma.facturaAsiento.createMany({
			data: facturas.map((f) => ({
				facturaId: f.ID,
				asientoId: asiento.id,
				tipoRelacion: 'AGRUPADO',
			})),
		})

		this.logger.log(
			`Asiento agrupado por cliente generado: ${cliente.RAZON_SOCIAL} → ${facturas.length} facturas → Asiento #${asiento.numero}`,
		)

		return {
			message: `${facturas.length} facturas del cliente ${cliente.RAZON_SOCIAL} agrupadas en asiento #${asiento.numero}`,
			asiento,
			facturasAgrupadas: facturas.length,
		}
	}

	/**
	 * Agrupa todas las facturas sin asiento agrupado de un período contable.
	 * Tarea 2.4.1 del plan.
	 */
	async agruparAsientosPorPeriodo(periodoId: number, empresaId: number, usuarioId: number) {
		const periodo = await this.prisma.periodoContable.findUnique({
			where: { id: periodoId },
		})

		if (!periodo) {
			throw new NotFoundException('Período contable no encontrado.')
		}

		if (periodo.estado === 'CERRADO') {
			throw new BadRequestException('No se puede agrupar asientos en un período CERRADO.')
		}

		const facturas = await this.prisma.fACTURAS.findMany({
			where: {
				ESTADO_FACTURA: 'AUTORIZADO',
				FECHA_EMISION: { gte: periodo.fechaInicio, lte: periodo.fechaFin },
				facturasAsiento: {
					none: { tipoRelacion: 'AGRUPADO' },
				},
			},
			include: { cliente: true },
		})

		if (facturas.length === 0) {
			return { message: `No hay facturas pendientes de agrupar en el período ${periodo.nombre}`, asiento: null }
		}

		let totalBase = 0
		let totalIva = 0
		let totalGeneral = 0
		facturas.forEach((f) => {
			totalBase += f.VALOR_SIN_IMPUESTO
			totalIva += f.IVA
			totalGeneral += f.TOTAL
		})

		const asiento = await this.generarAsientoAutomatico({
			tipoTransaccion: 'FACTURA_VENTA',
			empresaId,
			usuarioId,
			fecha: new Date(),
			montoBase: totalBase,
			montoIva: totalIva,
			montoTotal: totalGeneral,
			concepto: `Agrupación por período: ${periodo.nombre} (${facturas.length} facturas)`,
			referencia: `AGRUP-PER-${periodo.id}`,
		})

		await this.prisma.facturaAsiento.createMany({
			data: facturas.map((f) => ({
				facturaId: f.ID,
				asientoId: asiento.id,
				tipoRelacion: 'AGRUPADO',
			})),
		})

		this.logger.log(
			`Asiento agrupado por período generado: ${periodo.nombre} → ${facturas.length} facturas → Asiento #${asiento.numero}`,
		)

		return {
			message: `${facturas.length} facturas del período ${periodo.nombre} agrupadas en asiento #${asiento.numero}`,
			asiento,
			facturasAgrupadas: facturas.length,
		}
	}
}
