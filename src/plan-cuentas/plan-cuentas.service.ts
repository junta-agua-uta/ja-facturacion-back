import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { CreatePlanCuentaDto } from './dtos/create-plan-cuenta.dto'
import { UpdatePlanCuentaDto } from './dtos/update-plan-cuenta.dto'

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

  async crearCuenta(empresaId: number, data: CreatePlanCuentaDto) {
    const cuentaExistente = await this.prisma.planCuentas.findUnique({
      where: {
        empresaId_codigo: {
          empresaId,
          codigo: data.codigo,
        },
      },
    })

    if (cuentaExistente) {
      throw new BadRequestException(
        `El código de cuenta ${data.codigo} ya existe en esta empresa.`,
      )
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
          `Inconsistencia: El código de la subcuenta (${data.codigo}) debe iniciar con el código de su cuenta padre (${cuentaPadre.codigo}).`,
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
            'Vulnerabilidad detectada: No se puede crear subcuentas bajo una cuenta transaccional que ya posee historial de asientos contables. Reasigne esos asientos previamente.',
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
        empresaId,
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
      throw new BadRequestException(
        'La cuenta especificada no existe o no pertenece a esta empresa.',
      )
    }

    if (cuenta.hijas.length > 0) {
      throw new BadRequestException(
        'Imposible desactivar: La cuenta posee subcuentas que aún están activas.',
      )
    }

    const usoEnAsientos = await this.prisma.detalleAsiento.findFirst({
      where: {
        cuentaId,
        asiento: { estado: 'PENDIENTE' },
      },
    })

    if (usoEnAsientos) {
      throw new BadRequestException(
        'Imposible desactivar: La cuenta posee asientos contables en estado PENDIENTE.',
      )
    }

    return this.prisma.planCuentas.update({
      where: { id: cuentaId },
      data: { activo: false },
    })
  }

  async editarCuenta(
    cuentaId: number,
    empresaId: number,
    data: UpdatePlanCuentaDto,
  ) {
    // 1. Verificar que la cuenta existe y pertenece a la empresa
    const cuentaExistente = await this.prisma.planCuentas.findUnique({
      where: { id: cuentaId },
      include: {
        hijas: { where: { activo: true } },
        padre: true,
      },
    })

    if (!cuentaExistente) {
      throw new BadRequestException('La cuenta especificada no existe.')
    }

    if (cuentaExistente.empresaId !== empresaId) {
      throw new BadRequestException('La cuenta no pertenece a esta empresa.')
    }

    // 2. Validar que no se intente cambiar tipo/naturaleza si tiene transacciones
    if (
      (data.tipo && data.tipo !== cuentaExistente.tipo) ||
      (data.naturaleza && data.naturaleza !== cuentaExistente.naturaleza)
    ) {
      const tieneTransacciones = await this.prisma.detalleAsiento.findFirst({
        where: { cuentaId },
      })

      if (tieneTransacciones) {
        throw new BadRequestException(
          'No se puede cambiar el tipo o naturaleza de una cuenta que ya tiene transacciones asociadas.',
        )
      }
    }

    // 3. Validar cambio de código (si se modifica)
    let nivelCalculado = cuentaExistente.nivel
    let tipoFinal = cuentaExistente.tipo
    let naturalezaFinal = cuentaExistente.naturaleza
    let padreIdFinal = cuentaExistente.padreId

    if (data.codigo && data.codigo !== cuentaExistente.codigo) {
      // Verificar que el nuevo código no exista ya
      const codigoDuplicado = await this.prisma.planCuentas.findUnique({
        where: {
          empresaId_codigo: {
            empresaId,
            codigo: data.codigo,
          },
        },
      })

      if (codigoDuplicado && codigoDuplicado.id !== cuentaId) {
        throw new BadRequestException(
          `El código de cuenta ${data.codigo} ya existe en esta empresa.`,
        )
      }

      // Validar que el nuevo código sea consistente con el padre
      const padreActual = cuentaExistente.padre
      if (padreActual && !data.codigo.startsWith(padreActual.codigo)) {
        throw new BadRequestException(
          `Inconsistencia: El código de la subcuenta (${data.codigo}) debe iniciar con el código de su cuenta padre (${padreActual.codigo}).`,
        )
      }

      // Si no tiene padre, nivel debe ser 1
      if (!padreActual && data.codigo.split('.').length !== 1) {
        throw new BadRequestException(
          'Las cuentas raíz deben tener un código de nivel 1 (sin puntos).',
        )
      }
    }

    // 4. Validar cambio de padre (si se modifica)
    if (
      data.padreId !== undefined &&
      data.padreId !== cuentaExistente.padreId
    ) {
      if (data.padreId === null) {
        // Mover a raíz
        if (!data.codigo && cuentaExistente.codigo.split('.').length !== 1) {
          throw new BadRequestException(
            'Para mover esta cuenta a raíz, primero debe cambiar su código a nivel 1 (sin puntos).',
          )
        }
        padreIdFinal = null
        nivelCalculado = 1
      } else {
        // Validar que el nuevo padre existe
        const nuevoPadre = await this.prisma.planCuentas.findUnique({
          where: { id: data.padreId },
        })

        if (!nuevoPadre || nuevoPadre.empresaId !== empresaId) {
          throw new BadRequestException(
            'La cuenta padre especificada no existe o no pertenece a esta empresa.',
          )
        }

        // Validar que no se está intentando mover a un descendiente (evitar ciclos)
        if (nuevoPadre.id === cuentaId) {
          throw new BadRequestException(
            'Una cuenta no puede ser padre de sí misma.',
          )
        }

        // Verificar que el nuevo padre no sea descendiente de esta cuenta
        let ancestro = nuevoPadre.padreId
        while (ancestro) {
          if (ancestro === cuentaId) {
            throw new BadRequestException(
              'No se puede mover una cuenta a un descendiente (crearía un ciclo).',
            )
          }
          const padre = await this.prisma.planCuentas.findUnique({
            where: { id: ancestro },
          })
          ancestro = padre?.padreId || null
        }

        // Validar consistencia del código con el nuevo padre
        const codigoValidar = data.codigo || cuentaExistente.codigo
        if (!codigoValidar.startsWith(nuevoPadre.codigo)) {
          throw new BadRequestException(
            `Inconsistencia: El código de la subcuenta (${codigoValidar}) debe iniciar con el código de su nueva cuenta padre (${nuevoPadre.codigo}).`,
          )
        }

        padreIdFinal = nuevoPadre.id
        nivelCalculado = nuevoPadre.nivel + 1
        tipoFinal = nuevoPadre.tipo
        naturalezaFinal = nuevoPadre.naturaleza

        // Si el padre es detalle, convertirlo a no-detalle
        if (nuevoPadre.esDetalle) {
          const asientosAsociados = await this.prisma.detalleAsiento.count({
            where: { cuentaId: nuevoPadre.id },
          })

          if (asientosAsociados > 0) {
            throw new BadRequestException(
              'La cuenta destino tiene transacciones asociadas. No se puede crear subcuentas bajo ella.',
            )
          }

          await this.prisma.planCuentas.update({
            where: { id: nuevoPadre.id },
            data: { esDetalle: false },
          })
        }
      }
    }

    // 5. Si se cambia el código, actualizar también los códigos de las hijas (opcional)
    if (data.codigo && data.codigo !== cuentaExistente.codigo) {
      // Opcional: Actualizar códigos de subcuentas
      if (cuentaExistente.hijas.length > 0) {
        const oldPrefix = cuentaExistente.codigo
        const newPrefix = data.codigo

        for (const hija of cuentaExistente.hijas) {
          const newCodigo = hija.codigo.replace(oldPrefix, newPrefix)
          await this.prisma.planCuentas.update({
            where: { id: hija.id },
            data: { codigo: newCodigo },
          })
        }
      }
    }

    // 6. Preparar datos de actualización
    const updateData: any = {}

    if (data.codigo !== undefined) updateData.codigo = data.codigo
    if (data.nombre !== undefined) updateData.nombre = data.nombre
    if (data.casillero !== undefined) updateData.casillero = data.casillero
    if (data.activo !== undefined) updateData.activo = data.activo
    if (data.tipo !== undefined) updateData.tipo = tipoFinal
    if (data.naturaleza !== undefined) updateData.naturaleza = naturalezaFinal

    if (data.padreId !== undefined) {
      updateData.padreId = padreIdFinal
      updateData.nivel = nivelCalculado
    }

    // 7. Ejecutar actualización
    const cuentaActualizada = await this.prisma.planCuentas.update({
      where: { id: cuentaId },
      data: updateData,
      include: {
        padre: true,
        hijas: { where: { activo: true } },
      },
    })

    return cuentaActualizada
  }
}
