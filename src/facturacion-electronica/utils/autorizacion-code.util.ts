import { Logger } from '@nestjs/common'
import { AutorizationCodeDto } from './autorization-code.dto'

export function generateAccessKey(accessKeyData: AutorizationCodeDto) {
  let accessKey = ''
  accessKey += formatDateToDDMMYYYY(accessKeyData.date) // Fecha de emisión
  accessKey += accessKeyData.codDoc // Tipo de comprobante
  accessKey += accessKeyData.ruc // Número de RUC
  accessKey += accessKeyData.environment // Tipo de ambiente
  accessKey += accessKeyData.establishment // Establecimiento
  accessKey += accessKeyData.emissionPoint // Punto de emision
  accessKey += accessKeyData.sequential // Secuencial
  accessKey += generateRandomEightDigitNumber() // Código numérico
  accessKey += '1' // Tipo de emisión
  accessKey += generateVerificatorDigit(accessKey) // Dígito verificador
  return accessKey
}

function formatDateToDDMMYYYY(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}${month}${year}`
}

function generateRandomEightDigitNumber(): number {
  const min = 10000000
  const max = 99999999
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateVerificatorDigit(accessKey: string) {
  let result = 0
  let addition = 0
  let multiple = 7
  for (let i = 0; i < accessKey.length; i++) {
    addition += parseInt(accessKey.charAt(i)) * multiple
    if (multiple > 2) {
      multiple--
    } else {
      multiple = 7
    }
  }
  result = 11 - (addition % 11)
  if (result === 10) {
    result = 1
  }
  if (result === 11) {
    result = 0
  }
  return result
}

export async function parseXMLtoJSON(xmlString: string, xml2js) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    trim: true, // Elimina espacios en blanco alrededor de los valores
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
