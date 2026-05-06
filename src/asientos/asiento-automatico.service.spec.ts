// Jest globals (describe, it, expect, jest) son inyectados por la config de Jest del proyecto
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { AsientoAutomaticoService } from './asiento-automatico.service'

// ─── Helpers ────────────────────────────────────────────────────────────────

const makePrisma = (overrides: Record<string, any> = {}) => ({
	configAsientoAuto: { findFirst: jest.fn() },
	periodoContable: { findFirst: jest.fn(), findUnique: jest.fn() },
	asiento: { findFirst: jest.fn(), create: jest.fn() },
	facturaAsiento: { create: jest.fn(), createMany: jest.fn() },
	fACTURAS: { findMany: jest.fn() },
	aBONOS: { update: jest.fn() },
	$transaction: jest.fn(),
	...overrides,
})

const BASE_EMPRESA_ID = 1
const BASE_USUARIO_ID = 7

const mockPeriodo = {
	id: 10,
	nombre: 'Mayo 2026',
	estado: 'ABIERTO',
	fechaInicio: new Date('2026-05-01'),
	fechaFin: new Date('2026-05-31'),
	empresaId: BASE_EMPRESA_ID,
}

const mockConfig = (overrides: Record<string, any> = {}) => ({
	empresaId: BASE_EMPRESA_ID,
	tipoTransaccion: 'FACTURA_VENTA',
	activo: true,
	cuentaDebeId: 1,
	cuentaDebe: { id: 1, codigo: '1.1.02', nombre: 'Cuentas por Cobrar' },
	cuentaHaberId: 2,
	cuentaHaber: { id: 2, codigo: '4.1.01', nombre: 'Ingresos por Servicios' },
	cuentaIvaId: 3,
	cuentaIva: { id: 3, codigo: '2.1.07', nombre: 'IVA por Pagar' },
	...overrides,
})

const mockAsiento = (numero = 1) => ({
	id: 100,
	numero,
	fecha: new Date(),
	concepto: 'Test',
	estado: 'PENDIENTE',
	periodoId: 10,
	detallesAsiento: [],
	periodo: mockPeriodo,
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AsientoAutomaticoService', () => {
	let service: AsientoAutomaticoService
	let prisma: ReturnType<typeof makePrisma>

	beforeEach(() => {
		prisma = makePrisma()
		service = new AsientoAutomaticoService(prisma as any)
	})

	// ── generarAsientoAutomatico ─────────────────────────────────────────────

	describe('generarAsientoAutomatico', () => {
		it('genera asiento FACTURA_VENTA con 3 líneas cuando hay IVA', async () => {
			prisma.configAsientoAuto.findFirst.mockResolvedValue(mockConfig())
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)
			const created = mockAsiento(1)
			prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))
			prisma.asiento.create.mockResolvedValue(created)

			const resultado = await service.generarAsientoAutomatico({
				tipoTransaccion: 'FACTURA_VENTA',
				empresaId: BASE_EMPRESA_ID,
				usuarioId: BASE_USUARIO_ID,
				fecha: new Date('2026-05-10'),
				montoBase: 100,
				montoIva: 15,
				montoTotal: 115,
				concepto: 'Factura #001',
			})

			expect(resultado).toBe(created)
			// Debe incluir las 3 líneas: CxC, Ingreso e IVA
			const createCall = prisma.asiento.create.mock.calls[0][0]
			expect(createCall.data.detallesAsiento.create).toHaveLength(3)
			// Línea 1: DEBE total
			const lineaDebe = createCall.data.detallesAsiento.create[0]
			expect(lineaDebe.debe).toBe(115)
			expect(lineaDebe.haber).toBe(0)
			// Línea 2: HABER base
			const lineaHaber = createCall.data.detallesAsiento.create[1]
			expect(lineaHaber.debe).toBe(0)
			expect(lineaHaber.haber).toBe(100)
			// Línea 3: HABER IVA
			const lineaIva = createCall.data.detallesAsiento.create[2]
			expect(lineaIva.debe).toBe(0)
			expect(lineaIva.haber).toBe(15)
		})

		it('genera asiento FACTURA_VENTA con 2 líneas cuando NO hay IVA', async () => {
			prisma.configAsientoAuto.findFirst.mockResolvedValue(mockConfig())
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)
			prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))
			prisma.asiento.create.mockResolvedValue(mockAsiento(1))

			await service.generarAsientoAutomatico({
				tipoTransaccion: 'FACTURA_VENTA',
				empresaId: BASE_EMPRESA_ID,
				usuarioId: BASE_USUARIO_ID,
				fecha: new Date('2026-05-10'),
				montoBase: 100,
				montoIva: 0,       // sin IVA
				montoTotal: 100,
				concepto: 'Factura exenta',
			})

			const createCall = prisma.asiento.create.mock.calls[0][0]
			expect(createCall.data.detallesAsiento.create).toHaveLength(2)
		})

		it('genera asiento ABONO_EFECTIVO con cuenta diferenciada', async () => {
			const configEfectivo = mockConfig({
				tipoTransaccion: 'ABONO_EFECTIVO',
				cuentaDebe: { id: 10, codigo: '1.1.01.01', nombre: 'Caja General' },
				cuentaDebeId: 10,
			})
			prisma.configAsientoAuto.findFirst.mockResolvedValue(configEfectivo)
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)
			prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))
			prisma.asiento.create.mockResolvedValue(mockAsiento(2))

			await service.generarAsientoAutomatico({
				tipoTransaccion: 'ABONO_EFECTIVO',
				empresaId: BASE_EMPRESA_ID,
				usuarioId: BASE_USUARIO_ID,
				fecha: new Date('2026-05-10'),
				montoBase: 50,
				montoIva: 0,
				montoTotal: 50,
				concepto: 'Abono efectivo #A01',
				abonoId: 99,
			})

			const createCall = prisma.asiento.create.mock.calls[0][0]
			const detalles = createCall.data.detallesAsiento.create
			expect(detalles).toHaveLength(2)
			expect(detalles[0].codcta).toBe('1.1.01.01') // Caja
			expect(detalles[0].debe).toBe(50)
			expect(detalles[1].haber).toBe(50)            // CxC
			// Debe vincular el abono
			expect(prisma.aBONOS.update).toHaveBeenCalledWith({
				where: { ID: 99 },
				data: { asientoId: expect.any(Number) },
			})
		})

		it('genera asiento ABONO_TRANSFERENCIA correctamente', async () => {
			const configTransferencia = mockConfig({
				tipoTransaccion: 'ABONO_TRANSFERENCIA',
				cuentaDebe: { id: 11, codigo: '1.1.02.01', nombre: 'Banco Pichincha' },
				cuentaDebeId: 11,
			})
			prisma.configAsientoAuto.findFirst.mockResolvedValue(configTransferencia)
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)
			prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))
			prisma.asiento.create.mockResolvedValue(mockAsiento(3))

			await service.generarAsientoAutomatico({
				tipoTransaccion: 'ABONO_TRANSFERENCIA',
				empresaId: BASE_EMPRESA_ID,
				usuarioId: BASE_USUARIO_ID,
				fecha: new Date('2026-05-10'),
				montoBase: 75,
				montoIva: 0,
				montoTotal: 75,
				concepto: 'Transferencia bancaria',
			})

			const createCall = prisma.asiento.create.mock.calls[0][0]
			const detalles = createCall.data.detallesAsiento.create
			expect(detalles[0].codcta).toBe('1.1.02.01') // Banco
			expect(detalles[0].debe).toBe(75)
		})

		it('lanza NotFoundException si no hay config contable activa', async () => {
			prisma.configAsientoAuto.findFirst.mockResolvedValue(null)

			await expect(
				service.generarAsientoAutomatico({
					tipoTransaccion: 'FACTURA_VENTA',
					empresaId: BASE_EMPRESA_ID,
					usuarioId: BASE_USUARIO_ID,
					fecha: new Date(),
					montoBase: 100,
					montoIva: 0,
					montoTotal: 100,
					concepto: 'Test',
				}),
			).rejects.toThrow(NotFoundException)
		})

		it('lanza BadRequestException si no hay período contable abierto', async () => {
			prisma.configAsientoAuto.findFirst.mockResolvedValue(mockConfig())
			prisma.periodoContable.findFirst.mockResolvedValue(null)

			await expect(
				service.generarAsientoAutomatico({
					tipoTransaccion: 'FACTURA_VENTA',
					empresaId: BASE_EMPRESA_ID,
					usuarioId: BASE_USUARIO_ID,
					fecha: new Date(),
					montoBase: 100,
					montoIva: 0,
					montoTotal: 100,
					concepto: 'Test',
				}),
			).rejects.toThrow(BadRequestException)
		})

		it('lanza BadRequestException para tipo de transacción desconocido', async () => {
			prisma.configAsientoAuto.findFirst.mockResolvedValue(mockConfig({ tipoTransaccion: 'DESCONOCIDO' }))
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)

			await expect(
				service.generarAsientoAutomatico({
					tipoTransaccion: 'DESCONOCIDO',
					empresaId: BASE_EMPRESA_ID,
					usuarioId: BASE_USUARIO_ID,
					fecha: new Date(),
					montoBase: 100,
					montoIva: 0,
					montoTotal: 100,
					concepto: 'Test',
				}),
			).rejects.toThrow(BadRequestException)
		})

		it('vincula la factura en FacturaAsiento cuando se pasa facturaId', async () => {
			prisma.configAsientoAuto.findFirst.mockResolvedValue(mockConfig())
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)
			prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))
			prisma.asiento.create.mockResolvedValue(mockAsiento(1))

			await service.generarAsientoAutomatico({
				tipoTransaccion: 'FACTURA_VENTA',
				empresaId: BASE_EMPRESA_ID,
				usuarioId: BASE_USUARIO_ID,
				fecha: new Date('2026-05-10'),
				montoBase: 100,
				montoIva: 0,
				montoTotal: 100,
				concepto: 'Factura con vínculo',
				facturaId: 42,
			})

			expect(prisma.facturaAsiento.create).toHaveBeenCalledWith({
				data: { facturaId: 42, asientoId: 100, tipoRelacion: 'AUTOMATICO' },
			})
		})
	})

	// ── agruparAsientosPorDia ────────────────────────────────────────────────

	describe('agruparAsientosPorDia', () => {
		it('retorna mensaje vacío si no hay facturas ese día', async () => {
			prisma.fACTURAS.findMany.mockResolvedValue([])

			const resultado = await service.agruparAsientosPorDia(
				new Date('2026-05-10'),
				BASE_EMPRESA_ID,
				BASE_USUARIO_ID,
			)

			expect(resultado.asiento).toBeNull()
			expect(resultado.message).toContain('No hay facturas')
		})

		it('agrupa N facturas del día en un solo asiento', async () => {
			const facturas = [
				{ ID: 1, VALOR_SIN_IMPUESTO: 100, IVA: 15, TOTAL: 115, cliente: {} },
				{ ID: 2, VALOR_SIN_IMPUESTO: 200, IVA: 30, TOTAL: 230, cliente: {} },
			]
			prisma.fACTURAS.findMany.mockResolvedValue(facturas)
			// Mock interno de generarAsientoAutomatico
			prisma.configAsientoAuto.findFirst.mockResolvedValue(mockConfig())
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)
			prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))
			prisma.asiento.create.mockResolvedValue(mockAsiento(5))
			prisma.facturaAsiento.createMany.mockResolvedValue({ count: 2 })

			const resultado = await service.agruparAsientosPorDia(
				new Date('2026-05-10'),
				BASE_EMPRESA_ID,
				BASE_USUARIO_ID,
			)

			expect(resultado.facturasAgrupadas).toBe(2)
			expect(prisma.facturaAsiento.createMany).toHaveBeenCalledWith({
				data: [
					{ facturaId: 1, asientoId: 100, tipoRelacion: 'AGRUPADO' },
					{ facturaId: 2, asientoId: 100, tipoRelacion: 'AGRUPADO' },
				],
			})
			// Verifica que los montos se sumen correctamente
			const createCall = prisma.asiento.create.mock.calls[0][0]
			const linea1 = createCall.data.detallesAsiento.create[0]
			expect(linea1.debe).toBe(345) // 115 + 230
		})
	})

	// ── agruparAsientosPorPeriodo ────────────────────────────────────────────

	describe('agruparAsientosPorPeriodo', () => {
		it('lanza NotFoundException si el período no existe', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue(null)

			await expect(
				service.agruparAsientosPorPeriodo(999, BASE_EMPRESA_ID, BASE_USUARIO_ID),
			).rejects.toThrow(NotFoundException)
		})

		it('lanza BadRequestException si el período está CERRADO', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue({ ...mockPeriodo, estado: 'CERRADO' })

			await expect(
				service.agruparAsientosPorPeriodo(10, BASE_EMPRESA_ID, BASE_USUARIO_ID),
			).rejects.toThrow(BadRequestException)
		})

		it('retorna mensaje vacío si no hay facturas sin agrupar en el período', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue(mockPeriodo)
			prisma.fACTURAS.findMany.mockResolvedValue([])

			const resultado = await service.agruparAsientosPorPeriodo(
				10,
				BASE_EMPRESA_ID,
				BASE_USUARIO_ID,
			)

			expect(resultado.asiento).toBeNull()
		})
	})

	// ── agruparAsientosPorCliente ────────────────────────────────────────────

	describe('agruparAsientosPorCliente', () => {
		it('retorna mensaje vacío si el cliente no tiene facturas', async () => {
			prisma.fACTURAS.findMany.mockResolvedValue([])

			const resultado = await service.agruparAsientosPorCliente(
				55,
				BASE_EMPRESA_ID,
				BASE_USUARIO_ID,
			)

			expect(resultado.asiento).toBeNull()
			expect(resultado.message).toContain('No hay facturas')
		})

		it('agrupa las facturas del cliente correctamente', async () => {
			const facturas = [
				{
					ID: 10,
					VALOR_SIN_IMPUESTO: 80,
					IVA: 12,
					TOTAL: 92,
					cliente: { RAZON_SOCIAL: 'Juan Pérez', IDENTIFICACION: '1234567890' },
				},
			]
			prisma.fACTURAS.findMany.mockResolvedValue(facturas)
			prisma.configAsientoAuto.findFirst.mockResolvedValue(mockConfig())
			prisma.periodoContable.findFirst.mockResolvedValue(mockPeriodo)
			prisma.asiento.findFirst.mockResolvedValue(null)
			prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))
			prisma.asiento.create.mockResolvedValue(mockAsiento(6))
			prisma.facturaAsiento.createMany.mockResolvedValue({ count: 1 })

			const resultado = await service.agruparAsientosPorCliente(
				55,
				BASE_EMPRESA_ID,
				BASE_USUARIO_ID,
			)

			expect(resultado.facturasAgrupadas).toBe(1)
			expect(resultado.message).toContain('Juan Pérez')
		})
	})
})
