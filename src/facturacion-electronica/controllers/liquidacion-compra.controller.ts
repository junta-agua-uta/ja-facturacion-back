import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Logger,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  Res,
  Patch,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { Response } from 'express'
import {
  LiquidacionCompraInputDto,
  LiquidacionCompraSimplificadaDto,
  AnularLiquidacionDto,
} from '../dto/liquidacion-compra.dto'
import { ElectronicLiquidacionService } from '../services/electronic-liquidacion.service'
import { LiquidacionCalculationService } from '../services/liquidacion-calculation.service'
import { GenerarExcelLiquidacionesService } from '../services/generar-excel-liquidaciones.service'

@ApiTags('Liquidación de Compra')
@Controller('liquidacion-compra')
export class LiquidacionCompraController {
  private readonly logger = new Logger(LiquidacionCompraController.name)

  constructor(
    private readonly service: ElectronicLiquidacionService,
    private readonly calculationService: LiquidacionCalculationService,
    private readonly excelService: GenerarExcelLiquidacionesService,
  ) {}

  @Post('crear')
  @ApiOperation({
    summary: 'Crear y enviar liquidación de compra al SRI',
    description:
      'Solo requiere en detalles: descripcion, cantidad, precioUnitario, descuento, valorImpuesto. Los demás campos se calculan automáticamente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liquidación creada y enviada al SRI',
  })
  async crearYEnviar(@Body() dto: LiquidacionCompraSimplificadaDto) {
    this.logger.log(
      'Recibiendo request para crear y enviar liquidación simplificada',
    )

    // Convertir detalles simplificados a detalles completos
    const detallesCompletos =
      this.calculationService.convertirDetallesSimplificados(dto.detalles)

    // Calcular totales automáticamente
    const totales = this.calculationService.calcularTotales(detallesCompletos)

    // Actualizar los totales en la información de liquidación
    const infoActualizada = {
      ...dto.infoLiquidacionCompra,
      totalSinImpuestos: totales.totalSinImpuestos,
      totalDescuento: totales.totalDescuento,
      importeTotal: totales.importeTotal,
    }

    // Crear DTO completo para el servicio
    const liquidacionCompleta: LiquidacionCompraInputDto = {
      infoLiquidacionCompra: infoActualizada,
      detalles: detallesCompletos,
    }

    this.logger.log(
      `Totales calculados: Sin impuestos: ${totales.totalSinImpuestos}, Impuestos: ${totales.totalImpuestos}, Total: ${totales.importeTotal}`,
    )

    return this.service.enviarAlSRI(
      liquidacionCompleta,
      'proveedor@empresa.com',
    )
  }

  @Get('autorizar/:accessKey')
  @ApiOperation({
    summary: 'Consultar autorización del SRI por clave de acceso',
  })
  async autorizarPorClave(@Param('accessKey') accessKey: string) {
    return this.service.autorizarPorClave(accessKey)
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
      this.logger.log(
        `Obteniendo liquidaciones - página: ${page}, límite: ${limit}`,
      )
      return await this.service.listarLiquidacionesPaginadas(page, limit)
    } catch (error) {
      this.logger.error('Error al obtener liquidaciones:', error.message)
      throw new Error('Error al obtener liquidaciones: ' + error.message)
    }
  }

  @Get('descargar-excel')
  @ApiOperation({
    summary: 'Descargar Excel con liquidaciones de compra',
    description:
      'Genera y descarga un archivo Excel con todas las liquidaciones de compra registradas',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado correctamente',
    headers: {
      'Content-Type': {
        description: 'Tipo de contenido del archivo',
        schema: {
          type: 'string',
          example:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      },
      'Content-Disposition': {
        description: 'Disposición del contenido como archivo adjunto',
        schema: {
          type: 'string',
          example: 'attachment; filename=liquidaciones-compra.xlsx',
        },
      },
    },
  })
  async descargarExcelLiquidaciones(@Res() response: Response) {
    try {
      this.logger.log('Generando reporte Excel de liquidaciones de compra')

      // Obtener todas las liquidaciones
      const liquidaciones =
        await this.service.obtenerTodasLasLiquidacionesParaExcel()

      this.logger.log(
        `Obtenidas ${liquidaciones.length} liquidaciones para Excel`,
      )

      // Generar y enviar el archivo Excel
      await this.excelService.generarReporteLiquidaciones(
        response,
        liquidaciones,
      )

      this.logger.log(
        `Excel generado con ${liquidaciones.length} liquidaciones`,
      )
    } catch (error) {
      this.logger.error(
        'Error al generar Excel de liquidaciones:',
        error.message,
      )
      throw new Error(
        'Error al generar Excel de liquidaciones: ' + error.message,
      )
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener liquidación por ID',
    description: 'Obtiene una liquidación de compra específica con todos sus detalles',
  })
  @ApiResponse({
    status: 200,
    description: 'Liquidación obtenida correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Liquidación no encontrada',
  })
  async obtenerLiquidacionPorId(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Obteniendo liquidación con ID: ${id}`)
      return await this.service.obtenerLiquidacionPorId(id)
    } catch (error) {
      this.logger.error(
        `Error al obtener liquidación ${id}:`,
        error.message,
      )
      throw new Error(`Error al obtener liquidación: ${error.message}`)
    }
  }

  @Patch(':id/anular')
  @ApiOperation({
    summary: 'Anular liquidación de compra',
    description: 'Anula una liquidación de compra previamente autorizada. La liquidación debe estar en estado AUTORIZADO para poder ser anulada. El motivo de anulación se guarda en los metadatos del XML.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liquidación anulada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'La liquidación no puede ser anulada (ya está anulada o no está autorizada)',
  })
  @ApiResponse({
    status: 404,
    description: 'Liquidación no encontrada',
  })
  async anularLiquidacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularLiquidacionDto,
  ) {
    try {
      this.logger.log(
        `Anulando liquidación ${id}. Motivo: ${dto.motivoAnulacion}`,
      )
      return await this.service.anularLiquidacion(
        id,
        dto.motivoAnulacion,
        dto.usuarioAnulacion,
      )
    } catch (error) {
      this.logger.error(
        `Error al anular liquidación ${id}:`,
        error.message,
      )
      throw new Error(`Error al anular liquidación: ${error.message}`)
    }
  }
}
