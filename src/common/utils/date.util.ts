import { Injectable } from '@nestjs/common'

@Injectable()
export class DateUtil {
  static getCurrentDate(): Date {
    return new Date()
  }

  static getLocalDate(date: Date): Date {
    return new Date(date)
  }

  static getLocalDateEndOfDay(date: Date): Date {
    const local = new Date(date)
    local.setUTCHours(23 + 5, 59, 59, 999)
    return local
  }

  static formatDate(fecha: Date | string | null | undefined): string {
    if (!fecha) return 'Sin fecha'
    const d = new Date(fecha)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('es-ES', { timeZone: 'America/Guayaquil' })
  }
}
