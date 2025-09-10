import { Injectable } from '@nestjs/common'

@Injectable()
export class DateUtil {
  /**
   * Obtiene la fecha actual en la zona horaria local
   */
  static getCurrentDate(): Date {
    // Crear una fecha con la hora local
    const now = new Date()
    // Ajustar al offset local para asegurar que se mantenga la hora local
    return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000)
  }

  static getLocalDate(date: Date): Date {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
  }

  static getLocalDateEndOfDay(date: Date): Date {
    return new Date(date.getTime() + (24 - date.getHours()) * 60 * 60 * 1000)
  }
}
