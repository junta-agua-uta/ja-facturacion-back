// src/conceptos/models/concepto.model.ts
export interface Concepto {
  id: string
  codigo: string
  codInterno: string
  desc: string
  precioBase?: number
  requiereMes?: boolean
}
