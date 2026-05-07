/**
 * SEED: Plan de Cuentas y Configuración de Asientos Automáticos
 * ─────────────────────────────────────────────────────────────
 * Pobla las tablas contables básicas para la empresa ID:1
 * (Junta de Agua Potable).
 *
 * Ejecutar: npm run db:seed
 *
 * IMPORTANTE: Este seed es IDEMPOTENTE. Usa upsert, por lo que
 * puede correrse múltiples veces sin duplicar datos.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMPRESA_ID = 1;

// ─────────────────────────────────────────────────────────────
// Plan de Cuentas - Junta de Agua Potable
// Estructura: Código | Nombre | Tipo | Naturaleza | Nivel | esDetalle
// ─────────────────────────────────────────────────────────────
const planDeCuentas = [
  // ── ACTIVOS (1) ──────────────────────────────────────────────
  { codigo: '1', nombre: 'ACTIVOS', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 1, esDetalle: false, padreId: null },
  { codigo: '1.1', nombre: 'ACTIVO CORRIENTE', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 2, esDetalle: false, padreCodigo: '1' },
  { codigo: '1.1.01', nombre: 'CAJA', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, esDetalle: true, padreCodigo: '1.1' },
  { codigo: '1.1.02', nombre: 'BANCOS', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, esDetalle: true, padreCodigo: '1.1' },
  { codigo: '1.1.03', nombre: 'CUENTAS POR COBRAR', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, esDetalle: false, padreCodigo: '1.1' },
  { codigo: '1.1.03.01', nombre: 'CUENTAS POR COBRAR - USUARIOS', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, esDetalle: true, padreCodigo: '1.1.03' },
  { codigo: '1.1.03.02', nombre: 'IVA EN VENTAS POR COBRAR', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, esDetalle: true, padreCodigo: '1.1.03' },
  { codigo: '1.2', nombre: 'ACTIVO NO CORRIENTE', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 2, esDetalle: false, padreCodigo: '1' },
  { codigo: '1.2.01', nombre: 'PROPIEDAD PLANTA Y EQUIPO', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, esDetalle: true, padreCodigo: '1.2' },

  // ── PASIVOS (2) ──────────────────────────────────────────────
  { codigo: '2', nombre: 'PASIVOS', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 1, esDetalle: false, padreId: null },
  { codigo: '2.1', nombre: 'PASIVO CORRIENTE', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 2, esDetalle: false, padreCodigo: '2' },
  { codigo: '2.1.01', nombre: 'CUENTAS POR PAGAR', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, esDetalle: true, padreCodigo: '2.1' },
  { codigo: '2.1.02', nombre: 'IVA EN VENTAS POR PAGAR (SRI)', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, esDetalle: true, padreCodigo: '2.1' },

  // ── PATRIMONIO (3) ────────────────────────────────────────────
  { codigo: '3', nombre: 'PATRIMONIO', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 1, esDetalle: false, padreId: null },
  { codigo: '3.1', nombre: 'CAPITAL SOCIAL', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, esDetalle: true, padreCodigo: '3' },

  // ── INGRESOS (4) ─────────────────────────────────────────────
  { codigo: '4', nombre: 'INGRESOS', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 1, esDetalle: false, padreId: null },
  { codigo: '4.1', nombre: 'INGRESOS OPERACIONALES', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 2, esDetalle: false, padreCodigo: '4' },
  { codigo: '4.1.01', nombre: 'INGRESOS POR SERVICIO DE AGUA POTABLE', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, esDetalle: true, padreCodigo: '4.1' },
  { codigo: '4.1.02', nombre: 'INGRESOS POR RECONEXIONES', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, esDetalle: true, padreCodigo: '4.1' },
  { codigo: '4.1.03', nombre: 'INGRESOS POR MULTAS Y MORA', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, esDetalle: true, padreCodigo: '4.1' },

  // ── GASTOS (5) ───────────────────────────────────────────────
  { codigo: '5', nombre: 'GASTOS', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 1, esDetalle: false, padreId: null },
  { codigo: '5.1', nombre: 'GASTOS OPERACIONALES', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 2, esDetalle: false, padreCodigo: '5' },
  { codigo: '5.1.01', nombre: 'GASTOS ADMINISTRATIVOS', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, esDetalle: true, padreCodigo: '5.1' },
  { codigo: '5.1.02', nombre: 'GASTOS DE OPERACIÓN Y MANTENIMIENTO', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, esDetalle: true, padreCodigo: '5.1' },
  { codigo: '5.1.03', nombre: 'DEPRECIACIÓN ACUMULADA', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, esDetalle: true, padreCodigo: '5.1' },
];

async function seedPlanCuentas(): Promise<Record<string, number>> {
  console.log('\n📋 Sembrando Plan de Cuentas...');

  // Mapa de código → ID para resolver jerarquía
  const codigoToId: Record<string, number> = {};

  // Primero: cuentas raíz (sin padre)
  for (const cuenta of planDeCuentas.filter(c => !c.padreCodigo)) {
    const result = await prisma.planCuentas.upsert({
      where: { empresaId_codigo: { empresaId: EMPRESA_ID, codigo: cuenta.codigo } },
      update: { nombre: cuenta.nombre, activo: true },
      create: {
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
        nivel: cuenta.nivel,
        esDetalle: cuenta.esDetalle,
        empresaId: EMPRESA_ID,
      },
    });
    codigoToId[cuenta.codigo] = result.id;
    console.log(`   ✅ ${cuenta.codigo} - ${cuenta.nombre} (ID: ${result.id})`);
  }

  // Luego: cuentas con padre, ordenadas por nivel
  const conPadre = planDeCuentas.filter(c => c.padreCodigo).sort((a, b) => a.nivel - b.nivel);
  for (const cuenta of conPadre) {
    const padreId = codigoToId[cuenta.padreCodigo!];
    const result = await prisma.planCuentas.upsert({
      where: { empresaId_codigo: { empresaId: EMPRESA_ID, codigo: cuenta.codigo } },
      update: { nombre: cuenta.nombre, activo: true, padreId },
      create: {
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
        nivel: cuenta.nivel,
        esDetalle: cuenta.esDetalle,
        empresaId: EMPRESA_ID,
        padreId,
      },
    });
    codigoToId[cuenta.codigo] = result.id;
    console.log(`   ✅ ${cuenta.codigo} - ${cuenta.nombre} (ID: ${result.id})`);
  }

  return codigoToId;
}

async function seedConfigAsientos(codigoToId: Record<string, number>) {
  console.log('\n⚙️  Sembrando Configuración de Asientos Automáticos...');

  // Mapeo de cuentas por su código
  const CAJA              = codigoToId['1.1.01'];
  const BANCOS            = codigoToId['1.1.02'];
  const CXC_USUARIOS      = codigoToId['1.1.03.01'];
  const IVA_VENTAS_COBRAR = codigoToId['1.1.03.02'];
  const IVA_VENTAS_PAGAR  = codigoToId['2.1.02'];
  const INGRESOS_AGUA     = codigoToId['4.1.01'];

  const configs = [
    {
      tipoTransaccion: 'FACTURA_VENTA',
      descripcion: 'Al emitir una factura: Cuentas x Cobrar (D) / Ingresos (H)',
      cuentaDebeId: CXC_USUARIOS,       // Aumenta lo que nos deben
      cuentaHaberId: INGRESOS_AGUA,     // Reconocemos el ingreso
      cuentaIvaId: IVA_VENTAS_PAGAR,   // Si hay IVA, se registra como pasivo
    },
    {
      tipoTransaccion: 'ABONO_EFECTIVO',
      descripcion: 'Al recibir pago en efectivo: Caja (D) / Cuentas x Cobrar (H)',
      cuentaDebeId: CAJA,               // Entra dinero a caja
      cuentaHaberId: CXC_USUARIOS,     // Disminuye lo que nos deben
      cuentaIvaId: null,
    },
    {
      tipoTransaccion: 'ABONO_TRANSFERENCIA',
      descripcion: 'Al recibir transferencia: Bancos (D) / Cuentas x Cobrar (H)',
      cuentaDebeId: BANCOS,            // Entra dinero al banco
      cuentaHaberId: CXC_USUARIOS,    // Disminuye lo que nos deben
      cuentaIvaId: null,
    },
  ];

  for (const config of configs) {
    await prisma.configAsientoAuto.upsert({
      where: {
        empresaId_tipoTransaccion: {
          empresaId: EMPRESA_ID,
          tipoTransaccion: config.tipoTransaccion,
        },
      },
      update: {
        cuentaDebeId: config.cuentaDebeId,
        cuentaHaberId: config.cuentaHaberId,
        cuentaIvaId: config.cuentaIvaId,
        activo: true,
      },
      create: {
        tipoTransaccion: config.tipoTransaccion,
        empresaId: EMPRESA_ID,
        cuentaDebeId: config.cuentaDebeId,
        cuentaHaberId: config.cuentaHaberId,
        cuentaIvaId: config.cuentaIvaId,
        activo: true,
      },
    });
    console.log(`   ✅ ${config.tipoTransaccion} → DEBE: ${config.cuentaDebeId} | HABER: ${config.cuentaHaberId}`);
    console.log(`      (${config.descripcion})`);
  }
}

async function main() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  SEED: MÓDULO CONTABLE - JUNTA DE AGUA POTABLE');
  console.log('  Empresa ID:', EMPRESA_ID);
  console.log('════════════════════════════════════════════════════════');

  const codigoToId = await seedPlanCuentas();
  await seedConfigAsientos(codigoToId);

  console.log('\n════════════════════════════════════════════════════════');
  console.log('  ✅ Seed completado exitosamente.');
  console.log('  Los asientos automáticos ya están configurados.');
  console.log('  Tipos disponibles: FACTURA_VENTA, ABONO_EFECTIVO, ABONO_TRANSFERENCIA');
  console.log('════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
