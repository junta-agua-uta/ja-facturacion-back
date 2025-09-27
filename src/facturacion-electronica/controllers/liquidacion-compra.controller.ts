import { Controller, Post, Body, Get, Param, Logger, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LiquidacionCompraInputDto, LiquidacionCompraSimplificadaDto } from '../dto/liquidacion-compra.dto';
import { ElectronicLiquidacionService } from '../services/electronic-liquidacion.service';
import { LiquidacionCalculationService } from '../services/liquidacion-calculation.service';

@ApiTags('Liquidación de Compra')
@Controller('liquidacion-compra')
export class LiquidacionCompraController {
  private readonly logger = new Logger(LiquidacionCompraController.name);

  constructor(
    private readonly service: ElectronicLiquidacionService,
    private readonly calculationService: LiquidacionCalculationService
  ) {}

  @Post('crear')
  @ApiOperation({ 
    summary: 'Crear y enviar liquidación de compra al SRI',
    description: 'Solo requiere en detalles: descripcion, cantidad, precioUnitario, descuento, valorImpuesto. Los demás campos se calculan automáticamente.'
  })
  @ApiResponse({ status: 200, description: 'Liquidación creada y enviada al SRI' })
  async crearYEnviar(@Body() dto: LiquidacionCompraSimplificadaDto) {
    this.logger.log('Recibiendo request para crear y enviar liquidación simplificada');
    
    // Convertir detalles simplificados a detalles completos
    const detallesCompletos = this.calculationService.convertirDetallesSimplificados(dto.detalles);
    
    // Calcular totales automáticamente
    const totales = this.calculationService.calcularTotales(detallesCompletos);
    
    // Actualizar los totales en la información de liquidación
    const infoActualizada = {
      ...dto.infoLiquidacionCompra,
      totalSinImpuestos: totales.totalSinImpuestos,
      totalDescuento: totales.totalDescuento,
      importeTotal: totales.importeTotal
    };

    // Crear DTO completo para el servicio
    const liquidacionCompleta: LiquidacionCompraInputDto = {
      infoLiquidacionCompra: infoActualizada,
      detalles: detallesCompletos
    };

    this.logger.log(`Totales calculados: Sin impuestos: ${totales.totalSinImpuestos}, Impuestos: ${totales.totalImpuestos}, Total: ${totales.importeTotal}`);
    
    return this.service.enviarAlSRI(liquidacionCompleta, 'proveedor@empresa.com');
  }

  @Get('autorizar/:accessKey')
  @ApiOperation({ summary: 'Consultar autorización del SRI por clave de acceso' })
  async autorizarPorClave(@Param('accessKey') accessKey: string) {
    return this.service.autorizarPorClave(accessKey);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Obtener todas las liquidaciones',
    description: 'Obtiene todas las liquidaciones de compra paginadas',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async obtenerTodasLasLiquidaciones(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
  ) {
    try {
      this.logger.log(`Obteniendo liquidaciones - página: ${page}, límite: ${limit}`);
      return await this.service.listarLiquidacionesPaginadas(page, limit);
    } catch (error) {
      this.logger.error('Error al obtener liquidaciones:', error.message);
      throw new Error('Error al obtener liquidaciones: ' + error.message);
    }
  }


}
