/**
 * Script para "ponerse al día" con los asientos automáticos de las facturas
 * generadas desde una fecha determinada (por defecto 29/06/2026) hasta hoy.
 *
 * Genera UN asiento automático por cada factura AUTORIZADA que aún no tiene
 * asiento, replicando la lógica de AsientoAutomaticoService (FACTURA_VENTA):
 *   DEBE  Cuentas por Cobrar  -> TOTAL
 *   HABER Ingreso por Venta   -> VALOR_SIN_IMPUESTO
 *   HABER IVA por Pagar       -> IVA (si aplica y hay cuenta configurada)
 *
 * Si no existe un período contable ABIERTO que cubra la fecha de la factura,
 * se crea uno por mes (ABIERTO) para que el asiento pueda ser asignado.
 *
 * Uso:
 *   node scripts/reprocesar-asientos.js [fechaInicio] [empresaId]
 * Ejemplo:
 *   node scripts/reprocesar-asientos.js 2026-06-29 1
 */

const { PrismaClient } = require('@prisma/client')

// Cargar variables de entorno desde .env (Node >= 20.12)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env')
  } catch (e) {
    // si no hay .env, se usan las variables del entorno
  }
}

const prisma = new PrismaClient()

const FECHA_START_ARG = process.argv[2] || '2026-06-29'
const EMPRESA_ID_DEFAULT = Number(process.argv[3]) || 1

const TIPO_TRANSACCION = 'FACTURA_VENTA'
const TIPO_RELACION = 'AUTOMATICO'

function startOfDay(fechaStr) {
  const d = new Date(`${fechaStr}T00:00:00`)
  return d
}

function endOfMonth(anio, mes) {
  // mes es 1-based (1..12)
  return new Date(anio, mes, 0, 23, 59, 59, 999)
}

function monthName(mes) {
  const names = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  ]
  return names[mes - 1]
}

/**
 * Renderiza las líneas de detalle de un asiento de FACTURA_VENTA, replicando
 * construirDetalles del servicio AsientoAutomaticoService.
 */
function construirDetalles(datos, config) {
  const detalles = []
  // DEBE: Cuentas por Cobrar = Total
  detalles.push({
    codcta: config.cuentaDebe.codigo,
    nombre: config.cuentaDebe.nombre,
    descta: `CxC - ${datos.concepto}`,
    debe: datos.montoTotal,
    haber: 0,
    cuentaId: config.cuentaDebeId,
  })
  // HABER: Ingreso por venta = base sin impuestos
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
  return detalles
}

/**
 * Obtiene (o crea) un período contable ABIERTO que cubra la fecha dada.
 * Crea un período por mes civil completo si no existe uno ABIERTO que lo cubra.
 */
async function obtenerOCrearPeriodo(fecha, empresaId) {
  const anio = fecha.getFullYear()
  const mes = fecha.getMonth() + 1

  const existente = await prisma.periodoContable.findFirst({
    where: {
      empresaId,
      estado: 'ABIERTO',
      fechaInicio: { lte: fecha },
      fechaFin: { gte: fecha },
    },
  })
  if (existente) return existente

  const nombre = `${monthName(mes)} ${anio}`
  const fechaInicio = new Date(anio, mes - 1, 1, 0, 0, 0, 0)
  const fechaFin = endOfMonth(anio, mes)

  const porNombre = await prisma.periodoContable.findFirst({
    where: { empresaId, nombre },
  })

  if (porNombre && porNombre.estado !== 'ABIERTO') {
    // Existe cerrado (¿bloqueado?). No lo abrimos; lo reportamos.
    throw new Error(
      `Período "${nombre}" existe con estado "${porNombre.estado}". Ábrelo manualmente o usa otra estrategia.`,
    )
  }

  if (porNombre) return porNombre

  return prisma.periodoContable.create({
    data: { empresaId, nombre, fechaInicio, fechaFin, estado: 'ABIERTO' },
  })
}

/**
 * Genera el asiento automático para una factura, replicando
 * generarAsientoAutomatico del servicio.
 */
async function generarAsiento(factura, config, empresaId) {
  const fecha = factura.FECHA_EMISION || factura.FECHA_AUTORIZACION || new Date()

  const periodo = await obtenerOCrearPeriodo(fecha, empresaId)

  const datos = {
    tipoTransaccion: TIPO_TRANSACCION,
    empresaId,
    usuarioId: factura.ID_USUARIO,
    fecha,
    montoBase: factura.VALOR_SIN_IMPUESTO,
    montoIva: factura.IVA || 0,
    montoTotal: factura.TOTAL,
    concepto: `Factura de Venta ${factura.SECUENCIA} - ${factura.cliente?.RAZON_SOCIAL || factura.ID_CLIENTE}`,
    referencia: factura.SECUENCIA?.toString() || null,
    facturaId: factura.ID,
  }

  const detalles = construirDetalles(datos, config)

  let totalDebe = 0
  let totalHaber = 0
  detalles.forEach((d) => {
    totalDebe += d.debe
    totalHaber += d.haber
  })
  const descuadre = Math.round(Math.abs(totalDebe - totalHaber) * 100) / 100
  if (descuadre > 0.01) {
    throw new Error(
      `Asiento descuadrado para factura ${factura.ID}: Debe=${totalDebe}, Haber=${totalHaber}, Descuadre=${descuadre}`,
    )
  }

  const ultimoAsiento = await prisma.asiento.findFirst({
    where: { periodoId: periodo.id },
    orderBy: { numero: 'desc' },
  })
  const siguienteNumero = ultimoAsiento ? ultimoAsiento.numero + 1 : 1

  const asiento = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.asiento.create({
      data: {
        numero: siguienteNumero,
        fecha,
        nombre: `Asiento Automático #${siguienteNumero} - ${periodo.nombre}`,
        concepto: datos.concepto,
        modelo: 'AUTOMATICO',
        comprobante: datos.referencia,
        descuadre,
        estado: 'PENDIENTE',
        periodoId: periodo.id,
        creadoPorId: datos.usuarioId,
        detallesAsiento: {
          create: detalles.map((det, index) => ({
            no: index + 1,
            codcta: det.codcta,
            nombre: det.nombre,
            referencia: datos.referencia,
            descta: det.descta,
            debe: det.debe,
            haber: det.haber,
            cuentaId: det.cuentaId,
          })),
        },
      },
    })

    if (datos.facturaId) {
      await tx.facturaAsiento.create({
        data: {
          facturaId: datos.facturaId,
          asientoId: nuevo.id,
          tipoRelacion: TIPO_RELACION,
        },
      })
    }

    return nuevo
  })

  return asiento
}

async function main() {
  const fechaInicio = startOfDay(FECHA_START_ARG)
  const finDeHoy = new Date()
  finDeHoy.setHours(23, 59, 59, 999)

  const empresaId = EMPRESA_ID_DEFAULT

  console.log('==============================================')
  console.log(' Reprocesamiento de asientos automáticos')
  console.log('==============================================')
  console.log(` Empresa      : ${empresaId}`)
  console.log(` Fecha inicio : ${fechaInicio.toISOString().split('T')[0]}`)
  console.log(` Fecha fin    : ${finDeHoy.toISOString().split('T')[0]}`)
  console.log('----------------------------------------------')

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) {
    throw new Error(`No existe la empresa con id ${empresaId}`)
  }

  if (empresa.modoAsientos !== 'INDIVIDUAL') {
    console.log(
      `⚠️  La empresa está en modo "${empresa.modoAsientos}". ` +
        'Este script genera asientos individuales por factura; se continuará de todos modos.',
    )
  }

  const config = await prisma.configAsientoAuto.findFirst({
    where: { empresaId, tipoTransaccion: TIPO_TRANSACCION, activo: true },
    include: { cuentaDebe: true, cuentaHaber: true, cuentaIva: true },
  })
  if (!config) {
    throw new Error(
      `No existe configuración contable activa para "${TIPO_TRANSACCION}" en la empresa ${empresaId}.`,
    )
  }

  // Facturas autorizadas en el rango que aún no tienen asiento automático
  const facturas = await prisma.fACTURAS.findMany({
    where: {
      ESTADO_FACTURA: 'AUTORIZADO',
      OR: [
        { FECHA_EMISION: { gte: fechaInicio, lte: finDeHoy } },
        { FECHA_AUTORIZACION: { gte: fechaInicio, lte: finDeHoy } },
      ],
      facturasAsiento: { none: { tipoRelacion: TIPO_RELACION } },
    },
    include: { cliente: true },
    orderBy: { ID: 'asc' },
  })

  console.log(` Facturas AUTORIZADAS sin asiento: ${facturas.length}`)

  let ok = 0
  let creados = 0
  const errores = []

  for (const factura of facturas) {
    try {
      const asiento = await generarAsiento(factura, config, empresaId)
      creados++
      console.log(
        ` ✔ Factura ID ${factura.ID} (seq ${factura.SECUENCIA}) -> Asiento #${asiento.numero} (período ${asiento.periodoId})`,
      )
      ok++
    } catch (err) {
      errores.push({ facturaId: factura.ID, secuencia: factura.SECUENCIA, mensaje: err.message })
      console.log(` ✖ Factura ID ${factura.ID}: ${err.message}`)
    }
  }

  console.log('----------------------------------------------')
  console.log(` Resultado: ${creados} asientos creados, ${facturas.length - creados} fallos`)
  if (errores.length > 0) {
    console.log(' Errores:')
    errores.forEach((e) =>
      console.log(`   - Factura ${e.facturaId} (seq ${e.secuencia}): ${e.mensaje}`),
    )
  }
  console.log('==============================================')
}

main()
  .catch((err) => {
    console.error('Error fatal:', err.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
