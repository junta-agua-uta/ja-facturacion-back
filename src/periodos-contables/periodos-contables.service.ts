import { EstadoPeriodo, PrismaClient } from '@prisma/client'
import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { AuditoriaService } from '../common/services/auditoria.service'

@Injectable()
export class PeriodosContablesService {
  private readonly logger = new Logger(PeriodosContablesService.name)

  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditoriaService: AuditoriaService,
  ) {}

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

  async crearPeriodo(empresaId: number, data: any) {
    const fInicio = new Date(data.fechaInicio)
    const fFin = new Date(data.fechaFin)

    if (fInicio >= fFin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser cronológicamente anterior a la fecha de fin.',
      )
    }

    const solapamiento = await this.prisma.periodoContable.findFirst({
      where: {
        empresaId,
        OR: [{ fechaInicio: { lte: fFin }, fechaFin: { gte: fInicio } }],
      },
    })

    if (solapamiento) {
      throw new BadRequestException(
        `El rango ingresado entra en conflicto cronológico con el periodo existente: ${solapamiento.nombre}`,
      )
    }

    return this.prisma.periodoContable.create({
      data: {
        empresaId,
        nombre: data.nombre,
        fechaInicio: fInicio,
        fechaFin: fFin,
        estado: 'ABIERTO',
      },
    })
  }

  async bloquearPeriodo(periodoId: number, empresaId: number) {
    const periodo = await this.prisma.periodoContable.findUnique({
      where: { id: periodoId, empresaId },
    })

    if (!periodo) {
      throw new BadRequestException(
        'El periodo contable no existe o no pertenece a la empresa.',
      )
    }

    if (periodo.estado === 'CERRADO') return periodo

    const asientosPendientes = await this.prisma.asiento.count({
      where: { periodoId, estado: 'PENDIENTE' },
    })

    if (asientosPendientes > 0) {
      throw new BadRequestException(
        `Acción denegada: El periodo posee ${asientosPendientes} asientos en estado PENDIENTE. Apruébelos o elimínelos antes del cierre.`,
      )
    }

    return this.prisma.periodoContable.update({
      where: { id: periodoId },
      data: { estado: 'CERRADO' },
    })
  }

  async desbloquearPeriodo(periodoId: number, empresaId: number) {
    const periodo = await this.prisma.periodoContable.findUnique({
      where: { id: periodoId, empresaId },
    })

    if (!periodo) {
      throw new BadRequestException(
        'El periodo contable no existe o no pertenece a la empresa.',
      )
    }

    if (periodo.estado === 'ABIERTO') return periodo

    return this.prisma.periodoContable.update({
      where: { id: periodoId },
      data: { estado: 'ABIERTO' },
    })
  }

  /**
   * Cierre contable formal de un período.
   * Tareas 4.3.1 → 4.3.4 del plan.
   *
   * Flujo:
   * 1. Validaciones pre-cierre (no asientos PENDIENTE)
   * 2. Calcular saldos de cuentas de resultado (ingresos/gastos)
   * 3. Generar asiento de cierre (cuentas de resultado → utilidad/pérdida)
   * 4. Cerrar el período
   * 5. Registrar en auditoría
   */
  async cierreFormal(periodoId: number, empresaId: number, usuarioId: number) {
    // === 1. VALIDACIONES PRE-CIERRE ===
    const periodo = await this.prisma.periodoContable.findUnique({
      where: { id: periodoId },
    })

    if (!periodo || periodo.empresaId !== empresaId) {
      throw new BadRequestException('El período contable no existe o no pertenece a esta empresa.')
    }

    if (periodo.estado === 'CERRADO') {
      throw new BadRequestException('El período ya se encuentra CERRADO.')
    }

    const asientosPendientes = await this.prisma.asiento.count({
      where: { periodoId, estado: 'PENDIENTE' },
    })

    if (asientosPendientes > 0) {
      throw new BadRequestException(
        `Pre-cierre fallido: Existen ${asientosPendientes} asientos en estado PENDIENTE. ` +
        `Apruebe o elimine todos los asientos antes del cierre formal.`,
      )
    }

    // === 2. CALCULAR SALDOS DE CUENTAS DE RESULTADO ===
    const detallesAprobados = await this.prisma.detalleAsiento.findMany({
      where: {
        asiento: { periodoId, estado: 'APROBADO' },
      },
      include: { cuenta: true },
    })

    const saldosPorCuenta = new Map<number, {
      cuenta: any
      totalDebe: number
      totalHaber: number
    }>()

    for (const detalle of detallesAprobados) {
      const existing = saldosPorCuenta.get(detalle.cuentaId) || {
        cuenta: detalle.cuenta,
        totalDebe: 0,
        totalHaber: 0,
      }
      existing.totalDebe += Number(detalle.debe)
      existing.totalHaber += Number(detalle.haber)
      saldosPorCuenta.set(detalle.cuentaId, existing)
    }

    // Cuentas de resultado: Ingresos (código 4.x) y Gastos (código 5.x)
    const cuentasResultado: { cuentaId: number; codigo: string; nombre: string; saldo: number }[] = []
    let totalIngresos = 0
    let totalGastos = 0

    for (const [cuentaId, data] of saldosPorCuenta) {
      const codigo = data.cuenta.codigo
      if (codigo.startsWith('4')) {
        const saldo = data.totalHaber - data.totalDebe
        if (Math.abs(saldo) > 0.001) {
          cuentasResultado.push({ cuentaId, codigo, nombre: data.cuenta.nombre, saldo })
          totalIngresos += saldo
        }
      }
      if (codigo.startsWith('5')) {
        const saldo = data.totalDebe - data.totalHaber
        if (Math.abs(saldo) > 0.001) {
          cuentasResultado.push({ cuentaId, codigo, nombre: data.cuenta.nombre, saldo })
          totalGastos += saldo
        }
      }
    }

    const utilidadOPerdida = totalIngresos - totalGastos
    const esUtilidad = utilidadOPerdida >= 0

    // === 3. GENERAR ASIENTO DE CIERRE ===
    let asientoCierre = null

    if (cuentasResultado.length > 0) {
      const cuentaDestino = await this.prisma.planCuentas.findFirst({
        where: {
          empresaId,
          esDetalle: true,
          activo: true,
          codigo: { startsWith: '3' },
        },
        orderBy: { codigo: 'asc' },
      })

      if (!cuentaDestino) {
        throw new BadRequestException(
          'No se encontró una cuenta de Patrimonio (código 3.x) para registrar la utilidad/pérdida. ' +
          'Cree una cuenta de detalle en el grupo 3 antes de realizar el cierre.',
        )
      }

      const ultimoAsiento = await this.prisma.asiento.findFirst({
        where: { periodoId },
        orderBy: { numero: 'desc' },
      })
      const siguienteNumero = ultimoAsiento ? ultimoAsiento.numero + 1 : 1

      const detallesCierre: any[] = []
      let lineaNo = 1

      // Debitar ingresos para llevarlos a cero
      for (const cr of cuentasResultado) {
        if (cr.codigo.startsWith('4') && cr.saldo > 0) {
          detallesCierre.push({
            no: lineaNo++, codcta: cr.codigo, nombre: cr.nombre,
            referencia: `CIERRE-${periodo.nombre}`,
            descta: 'Cierre de cuenta de ingreso',
            debe: Math.round(cr.saldo * 100) / 100, haber: 0, cuentaId: cr.cuentaId,
          })
        }
      }

      // Acreditar gastos para llevarlos a cero
      for (const cr of cuentasResultado) {
        if (cr.codigo.startsWith('5') && cr.saldo > 0) {
          detallesCierre.push({
            no: lineaNo++, codcta: cr.codigo, nombre: cr.nombre,
            referencia: `CIERRE-${periodo.nombre}`,
            descta: 'Cierre de cuenta de gasto',
            debe: 0, haber: Math.round(cr.saldo * 100) / 100, cuentaId: cr.cuentaId,
          })
        }
      }

      // Resultado a patrimonio
      const montoResultado = Math.round(Math.abs(utilidadOPerdida) * 100) / 100
      if (montoResultado > 0) {
        detallesCierre.push({
          no: lineaNo++, codcta: cuentaDestino.codigo, nombre: cuentaDestino.nombre,
          referencia: `CIERRE-${periodo.nombre}`,
          descta: esUtilidad ? 'Utilidad del ejercicio' : 'Pérdida del ejercicio',
          debe: esUtilidad ? 0 : montoResultado,
          haber: esUtilidad ? montoResultado : 0,
          cuentaId: cuentaDestino.id,
        })
      }

      asientoCierre = await this.prisma.asiento.create({
        data: {
          numero: siguienteNumero,
          fecha: periodo.fechaFin,
          nombre: `Asiento de Cierre - ${periodo.nombre}`,
          concepto: `Cierre contable formal. ${esUtilidad ? 'Utilidad' : 'Pérdida'}: $${montoResultado.toFixed(2)}`,
          modelo: 'CIERRE',
          comprobante: `CIERRE-${periodo.id}`,
          descuadre: 0,
          estado: 'APROBADO',
          periodoId,
          creadoPorId: usuarioId,
          aprobadoPorId: usuarioId,
          fechaAprobacion: new Date(),
          detallesAsiento: { create: detallesCierre },
        },
        include: { detallesAsiento: true },
      })

      this.logger.log(
        `Asiento de cierre #${asientoCierre.numero} generado. ${esUtilidad ? 'Utilidad' : 'Pérdida'}: $${montoResultado.toFixed(2)}`,
      )
    }

    // === 4. CERRAR EL PERÍODO ===
    const periodoCerrado = await this.prisma.periodoContable.update({
      where: { id: periodoId },
      data: { estado: 'CERRADO' },
    })

    // === 5. AUDITORÍA ===
    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'CIERRE_CONTABLE_FORMAL',
      entidad: 'PeriodoContable',
      entidadId: periodoId,
      datosPrevios: { estado: 'ABIERTO' },
      datosNuevos: {
        estado: 'CERRADO',
        asientoCierreId: asientoCierre?.id || null,
        utilidadOPerdida,
      },
    })

    return {
      message: `Cierre contable formal completado para ${periodo.nombre}`,
      periodo: periodoCerrado,
      asientoCierre,
      resumen: {
        totalIngresos: Math.round(totalIngresos * 100) / 100,
        totalGastos: Math.round(totalGastos * 100) / 100,
        resultado: esUtilidad ? 'UTILIDAD' : 'PÉRDIDA',
        monto: Math.round(Math.abs(utilidadOPerdida) * 100) / 100,
        cuentasCerradas: cuentasResultado.length,
      },
    }
  }
}
