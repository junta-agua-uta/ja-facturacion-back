import { Injectable } from '@nestjs/common';
import { DetalleSimplificadoDto, DetalleLiquidacionDto } from '../dto/liquidacion-compra.dto';

@Injectable()
export class LiquidacionCalculationService {
  
  /**
   * Convierte detalles simplificados a detalles completos calculando los valores faltantes
   * Solo acepta: descripcion, cantidad, precioUnitario, descuento, valorImpuesto
   * Genera automáticamente los campos faltantes con valores específicos
   */
  convertirDetallesSimplificados(detallesSimplificados: DetalleSimplificadoDto[]): DetalleLiquidacionDto[] {
    return detallesSimplificados.map((detalle, index) => {
      // Calcular precio total sin impuesto: (cantidad × precioUnitario) - descuento
      const precioTotalSinImpuesto = (detalle.cantidad * detalle.precioUnitario) - detalle.descuento;
      
      // Base imponible = precio total sin impuesto
      const baseImponible = precioTotalSinImpuesto;
      
      // Calcular tarifa del impuesto basada en el valor del impuesto
      let tarifaImpuesto = 12; // Por defecto 12%
      if (detalle.valorImpuesto > 0 && baseImponible > 0) {
        tarifaImpuesto = (detalle.valorImpuesto / baseImponible) * 100;
      }
      
      return {
        // Campos que vienen del input
        descripcion: detalle.descripcion,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        descuento: detalle.descuento,
        valorImpuesto: Number(detalle.valorImpuesto.toFixed(2)),
        
        // Campos calculados
        precioTotalSinImpuesto: Number(precioTotalSinImpuesto.toFixed(2)),
        baseImponible: Number(baseImponible.toFixed(2)),
        tarifaImpuesto: Number(tarifaImpuesto.toFixed(2)),
        
        // Campos generados automáticamente con valores específicos
        codigoPrincipal: this.generarCodigoAleatorio('PROD'),
        codigoAuxiliar: this.generarCodigoAleatorio('AUX'),
        unidadMedida: 'UNI',
        codigoImpuesto: '2',
        codigoPorcentajeImpuesto: '2'
      };
    });
  }

  /**
   * Genera un código aleatorio con un prefijo
   */
  private generarCodigoAleatorio(prefijo: string): string {
    const numero = Math.floor(Math.random() * 999) + 1;
    return `${prefijo}${String(numero).padStart(3, '0')}`;
  }

  /**
   * Obtiene el código de porcentaje según la tarifa del impuesto
   */
  private obtenerCodigoPorcentaje(tarifa: number): string {
    if (tarifa === 0) return '0'; // 0%
    if (tarifa === 12) return '2'; // 12%
    if (tarifa === 14) return '3'; // 14%
    if (tarifa === 15) return '4'; // 15%
    return '2'; // Por defecto 12%
  }

  /**
   * Calcula los totales de la liquidación
   */
  calcularTotales(detalles: DetalleLiquidacionDto[]): {
    totalSinImpuestos: number;
    totalDescuento: number;
    totalImpuestos: number;
    importeTotal: number;
  } {
    const totalSinImpuestos = detalles.reduce((sum, detalle) => sum + detalle.precioTotalSinImpuesto, 0);
    const totalDescuento = detalles.reduce((sum, detalle) => sum + detalle.descuento, 0);
    const totalImpuestos = detalles.reduce((sum, detalle) => sum + detalle.valorImpuesto, 0);
    const importeTotal = totalSinImpuestos + totalImpuestos;

    return {
      totalSinImpuestos: Number(totalSinImpuestos.toFixed(2)),
      totalDescuento: Number(totalDescuento.toFixed(2)),
      totalImpuestos: Number(totalImpuestos.toFixed(2)),
      importeTotal: Number(importeTotal.toFixed(2))
    };
  }
}