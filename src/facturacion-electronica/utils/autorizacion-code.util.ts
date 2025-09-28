import { Logger } from '@nestjs/common'
import { AutorizationCodeDto } from './autorization-code.dto'

export function generateAccessKey(accessKeyData: AutorizationCodeDto) {
  // Normalizar y padear campos según especificación SRI
  const codDoc = String(accessKeyData.codDoc).padStart(2, '0') // 2
  const ruc = String(accessKeyData.ruc).padStart(13, '0') // 13
  const environment = String(accessKeyData.environment).padStart(1, '0') // 1
  const establishment = String(accessKeyData.establishment).padStart(3, '0') // 3
  const emissionPoint = String(accessKeyData.emissionPoint).padStart(3, '0') // 3
  const sequential = String(accessKeyData.sequential).padStart(9, '0') // 9
  const tipoEmision = '1' // 1
  const fecha = formatDateToDDMMYYYY(accessKeyData.date) // 8
  const codigoNumerico = String(generateRandomEightDigitNumber()) // 8

  // Construcción sin dígito verificador
  const base =
    fecha +
    codDoc +
    ruc +
    environment +
    establishment +
    emissionPoint +
    sequential +
    codigoNumerico +
    tipoEmision

  const dv = generateVerificatorDigit(base) // Módulo 11
  return base + String(dv)
}

function formatDateToDDMMYYYY(date: Date) {
  // Usar fecha LOCAL (no UTC) como espera el SRI
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}${month}${year}`
}

function generateRandomEightDigitNumber(): number {
  // Asegura 8 dígitos (sin ceros a la izquierda)
  const min = 10000000
  const max = 99999999
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateVerificatorDigit(accessKey: string) {
  // Ponderadores 2..7 aplicados de DERECHA a IZQUIERDA (módulo 11 SRI)
  const weights = [2, 3, 4, 5, 6, 7]
  let sum = 0
  let j = 0
  for (let i = accessKey.length - 1; i >= 0; i--) {
    const digit = parseInt(accessKey.charAt(i), 10)
    sum += digit * weights[j]
    j = (j + 1) % weights.length
  }
  let result = 11 - (sum % 11)
  if (result === 10) result = 1
  if (result === 11) result = 0
  return result
}

export async function parseXMLtoJSON(xmlString: string, xml2js) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    trim: true, // Elimina espacios en blanco
    explicitRoot: false, // No incluye el nodo raíz en el resultado
  })

  try {
    const result = await parser.parseStringPromise(xmlString)
    return result
  } catch (error) {
    Logger.error('Error al parsear el XML:', error)
    throw new Error('No se pudo procesar el XML')
  }
}
