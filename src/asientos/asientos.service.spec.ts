// Jest globals (describe, it, expect, jest) son inyectados por la config de Jest del proyecto
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { AsientosService } from './asientos.service'

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const mockAuditoria = { registrar: jest.fn() }

const makePrisma = () => ({
	asiento: {
		findFirst: jest.fn(),
		findUnique: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		findMany: jest.fn(),
	},
	periodoContable: { findUnique: jest.fn() },
	planCuentas: { findMany: jest.fn() },
	detalleAsiento: { deleteMany: jest.fn(), createMany: jest.fn() },
	facturaAsiento: { deleteMany: jest.fn() },
	aBONOS: { updateMany: jest.fn() },
	$transaction: jest.fn(),
})

const mockPeriodoAbierto = {
	id: 10,
	nombre: 'Mayo 2026',
	estado: 'ABIERTO',
	fechaInicio: new Date('2026-05-01'),
	fechaFin: new Date('2026-05-31'),
}

const mockCuentasDetalle = [
	{ id: 1, codigo: '1.1.02', nombre: 'CxC', esDetalle: true },
	{ id: 2, codigo: '4.1.01', nombre: 'Ingreso', esDetalle: true },
]

const mockAsientoPendiente = {
	id: 100,
	numero: 1,
	estado: 'PENDIENTE',
	descuadre: 0,
	periodo: mockPeriodoAbierto,
}

const mockAsientoAprobado = { ...mockAsientoPendiente, estado: 'APROBADO' }

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AsientosService', () => {
	let service: AsientosService
	let prisma: ReturnType<typeof makePrisma>

	beforeEach(() => {
		prisma = makePrisma()
		service = new AsientosService(prisma as any, mockAuditoria as any)
		jest.clearAllMocks()
	})

	// ── crearAsiento ─────────────────────────────────────────────────────────

	describe('crearAsiento', () => {
		const dtoBase = {
			fecha: '2026-05-10',
			concepto: 'Venta de servicios',
			periodoId: 10,
			creadoPorId: 1,
			detalles: [
				{ cuentaId: 1, debe: 115, haber: 0 },
				{ cuentaId: 2, debe: 0, haber: 115 },
			],
		}

		it('crea un asiento cuadrado correctamente', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue(mockPeriodoAbierto)
			prisma.planCuentas.findMany.mockResolvedValue(mockCuentasDetalle)
			prisma.asiento.findFirst.mockResolvedValue(null)
			prisma.asiento.create.mockResolvedValue({ id: 100, numero: 1 })

			const result = await service.crearAsiento(dtoBase as any)

			expect(result).toEqual({ id: 100, numero: 1 })
			const createCall = prisma.asiento.create.mock.calls[0][0]
			expect(createCall.data.descuadre).toBe(0)
			expect(createCall.data.estado).toBe('PENDIENTE')
		})

		it('lanza BadRequestException si el período está CERRADO', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue({ ...mockPeriodoAbierto, estado: 'CERRADO' })

			await expect(service.crearAsiento(dtoBase as any)).rejects.toThrow(BadRequestException)
		})

		it('lanza NotFoundException si el período no existe', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue(null)

			await expect(service.crearAsiento(dtoBase as any)).rejects.toThrow(NotFoundException)
		})

		it('lanza BadRequestException si la fecha está fuera del período', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue(mockPeriodoAbierto)
			prisma.planCuentas.findMany.mockResolvedValue(mockCuentasDetalle)

			const dtoFueraDeRango = { ...dtoBase, fecha: '2026-07-01' }
			await expect(service.crearAsiento(dtoFueraDeRango as any)).rejects.toThrow(BadRequestException)
		})

		it('lanza BadRequestException si se usa una cuenta mayor (no de detalle)', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue(mockPeriodoAbierto)
			prisma.planCuentas.findMany.mockResolvedValue([
				{ id: 1, codigo: '1.1', nombre: 'Activo Corriente', esDetalle: false }, // mayor
				{ id: 2, codigo: '4.1.01', nombre: 'Ingreso', esDetalle: true },
			])

			await expect(service.crearAsiento(dtoBase as any)).rejects.toThrow(BadRequestException)
		})

		it('calcula el número de asiento como último + 1', async () => {
			prisma.periodoContable.findUnique.mockResolvedValue(mockPeriodoAbierto)
			prisma.planCuentas.findMany.mockResolvedValue(mockCuentasDetalle)
			prisma.asiento.findFirst.mockResolvedValue({ numero: 7 })
			prisma.asiento.create.mockResolvedValue({ id: 101, numero: 8 })

			await service.crearAsiento(dtoBase as any)

			const createCall = prisma.asiento.create.mock.calls[0][0]
			expect(createCall.data.numero).toBe(8)
		})
	})

	// ── aprobarAsiento ───────────────────────────────────────────────────────

	describe('aprobarAsiento', () => {
		it('aprueba correctamente un asiento PENDIENTE cuadrado', async () => {
			prisma.asiento.findUnique.mockResolvedValue(mockAsientoPendiente)
			prisma.asiento.update.mockResolvedValue({ ...mockAsientoPendiente, estado: 'APROBADO' })

			const resultado = await service.aprobarAsiento(100, 1)

			expect(resultado.estado).toBe('APROBADO')
			expect(mockAuditoria.registrar).toHaveBeenCalledWith(
				expect.objectContaining({ accion: 'APROBAR_ASIENTO' }),
			)
		})

		it('lanza NotFoundException si el asiento no existe', async () => {
			prisma.asiento.findUnique.mockResolvedValue(null)

			await expect(service.aprobarAsiento(999, 1)).rejects.toThrow(NotFoundException)
		})

		it('lanza BadRequestException si el asiento ya está APROBADO', async () => {
			prisma.asiento.findUnique.mockResolvedValue(mockAsientoAprobado)

			await expect(service.aprobarAsiento(100, 1)).rejects.toThrow(BadRequestException)
		})

		it('lanza BadRequestException si el asiento tiene descuadre', async () => {
			prisma.asiento.findUnique.mockResolvedValue({
				...mockAsientoPendiente,
				descuadre: 0.05,
			})

			await expect(service.aprobarAsiento(100, 1)).rejects.toThrow(BadRequestException)
		})

		it('lanza BadRequestException si el período está CERRADO', async () => {
			prisma.asiento.findUnique.mockResolvedValue({
				...mockAsientoPendiente,
				periodo: { ...mockPeriodoAbierto, estado: 'CERRADO' },
			})

			await expect(service.aprobarAsiento(100, 1)).rejects.toThrow(BadRequestException)
		})
	})

	// ── aprobarAsientosEnLote ────────────────────────────────────────────────

	describe('aprobarAsientosEnLote', () => {
		it('devuelve resumen correcto de aprobados y fallidos', async () => {
			// Asiento 1: aprobable
			prisma.asiento.findUnique
				.mockResolvedValueOnce(mockAsientoPendiente)
				.mockResolvedValueOnce(null) // Asiento 2: no existe
			prisma.asiento.update.mockResolvedValue({ ...mockAsientoPendiente, estado: 'APROBADO' })

			const resultado = await service.aprobarAsientosEnLote([100, 999], 1)

			expect(resultado.totalProcesados).toBe(2)
			expect(resultado.totalAprobados).toBe(1)
			expect(resultado.totalFallidos).toBe(1)
			expect(resultado.fallidos[0].id).toBe(999)
		})
	})

	// ── eliminarAsiento ──────────────────────────────────────────────────────

	describe('eliminarAsiento', () => {
		it('elimina un asiento PENDIENTE correctamente', async () => {
			prisma.asiento.findUnique.mockResolvedValue(mockAsientoPendiente)
			prisma.$transaction.mockResolvedValue([])

			const result = await service.eliminarAsiento(100)

			expect(result.message).toContain('eliminado')
			expect(prisma.$transaction).toHaveBeenCalled()
		})

		it('lanza NotFoundException si el asiento no existe', async () => {
			prisma.asiento.findUnique.mockResolvedValue(null)

			await expect(service.eliminarAsiento(999)).rejects.toThrow(NotFoundException)
		})

		it('lanza BadRequestException si el asiento no está PENDIENTE', async () => {
			prisma.asiento.findUnique.mockResolvedValue(mockAsientoAprobado)

			await expect(service.eliminarAsiento(100)).rejects.toThrow(BadRequestException)
		})

		it('lanza BadRequestException si el período está CERRADO', async () => {
			prisma.asiento.findUnique.mockResolvedValue({
				...mockAsientoPendiente,
				periodo: { ...mockPeriodoAbierto, estado: 'CERRADO' },
			})

			await expect(service.eliminarAsiento(100)).rejects.toThrow(BadRequestException)
		})
	})

	// ── listarAsientos ───────────────────────────────────────────────────────

	describe('listarAsientos', () => {
		it('retorna paginación correcta', async () => {
			prisma.asiento.count.mockResolvedValue(25)
			prisma.asiento.findMany.mockResolvedValue(Array(10).fill({ id: 1 }))

			const resultado = await service.listarAsientos(2, 10)

			expect(resultado.page).toBe(2)
			expect(resultado.limit).toBe(10)
			expect(resultado.total).toBe(25)
			expect(resultado.totalPages).toBe(3)
			expect(resultado.data).toHaveLength(10)
		})

		it('filtra correctamente por estado y periodoId', async () => {
			prisma.asiento.count.mockResolvedValue(3)
			prisma.asiento.findMany.mockResolvedValue([])

			await service.listarAsientos(1, 10, 'PENDIENTE' as any, 10)

			const whereArg = prisma.asiento.findMany.mock.calls[0][0].where
			expect(whereArg.estado).toBe('PENDIENTE')
			expect(whereArg.periodoId).toBe(10)
		})
	})
})
