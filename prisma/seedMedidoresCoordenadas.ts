/**
 * SEED: Coordenadas de medidores reales (latitud/longitud)
 * ─────────────────────────────────────────────────────────────
 * Carga LATITUD/LONGITUD/NUMERO_MEDIDOR/ID_CLIENTE para los medidores
 * ya vinculados a clientes reales, extraídos del informe de
 * georreferenciación de la junta (ver ESTADO_CARGA_MEDIDORES.md).
 *
 * Ejecutar: npx ts-node --transpile-only prisma/seedMedidoresCoordenadas.ts
 *
 * IMPORTANTE: Este seed es IDEMPOTENTE. Usa upsert por NUMERO_MEDIDOR,
 * por lo que puede correrse múltiples veces sin duplicar medidores.
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface MedidorConvertido {
  numeroMedidor: string
  sector: string
  este: number
  norte: number
  latitud: number
  longitud: number
  idCliente: string
  clienteRazonSocial: string
  ubicacion: string
}

async function main() {
  const dataPath = path.join(__dirname, 'data', 'medidores_convertidos_latlon.json')
  const medidores: MedidorConvertido[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

  console.log('\n════════════════════════════════════════════════════════')
  console.log('  SEED: COORDENADAS DE MEDIDORES REALES')
  console.log('  Total a procesar:', medidores.length)
  console.log('════════════════════════════════════════════════════════\n')

  let creados = 0
  let actualizados = 0
  let errores = 0

  for (const m of medidores) {
    const idCliente = parseInt(m.idCliente, 10)

    try {
      const clienteExiste = await prisma.cLIENTES.findUnique({ where: { ID: idCliente } })
      if (!clienteExiste) {
        console.log(`   ⚠️  Medidor ${m.numeroMedidor}: cliente ID ${idCliente} no existe, se omite.`)
        errores++
        continue
      }

      const existente = await prisma.mEDIDORES.findUnique({
        where: { NUMERO_MEDIDOR: m.numeroMedidor },
      })

      await prisma.mEDIDORES.upsert({
        where: { NUMERO_MEDIDOR: m.numeroMedidor },
        update: {
          LATITUD: m.latitud,
          LONGITUD: m.longitud,
          ID_CLIENTE: idCliente,
          UBICACION: m.ubicacion,
        },
        create: {
          NUMERO_MEDIDOR: m.numeroMedidor,
          LATITUD: m.latitud,
          LONGITUD: m.longitud,
          ID_CLIENTE: idCliente,
          UBICACION: m.ubicacion,
        },
      })

      if (existente) {
        actualizados++
      } else {
        creados++
      }
      console.log(`   ✅ Medidor ${m.numeroMedidor} (${m.sector}) → cliente ${idCliente} "${m.clienteRazonSocial}"`)
    } catch (e) {
      console.error(`   ❌ Error en medidor ${m.numeroMedidor}:`, (e as Error).message)
      errores++
    }
  }

  console.log('\n════════════════════════════════════════════════════════')
  console.log('  ✅ Seed completado.')
  console.log(`  Creados: ${creados} | Actualizados: ${actualizados} | Errores: ${errores}`)
  console.log('════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
