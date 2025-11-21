/* eslint-disable no-console */
import {
  Body,
  Controller,
  Get,
  Post,
  Logger,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  Param,
  Res,
  Patch,
} from '@nestjs/common'
import { ObtenerFacturaPorIdService } from './services/obtenerFacturaPorId.service'
import { ObtenerFacturaPorCedulaService } from './services/obtenerFacturaPorCedula.service'
import { ObtenerTodasLasFacturasService } from './services/obtenerTodasLasFacturas.service'
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { CrearFacturaDto } from './dtos/crearFactura.dto'
import { AgregarFacturaService } from './services/agregarFactura.service'
import { BuscarFacturasPorFechaDto } from './dtos/buscarFacturaFecha.dto'
import { ObtenerFacturaPorFechaService } from './services/obtenerFacturasPorFecha.service'
import { GenerarExelService } from './services/generar-exel.service'
import { AnularFacturaService } from './services/anularFactura.service'
import { ObtenerFacturasAnuladasService } from './services/obtenerFacturasAnuladas.service'
import { Response } from 'express'

@ApiTags('Facturas')
/* @ApiBearerAuth('access-token')
@UseGuards(AuthGuard) */
@Controller('facturas')
export class FacturasController {
  constructor(
    private readonly obtenerFacturaPorIdService: ObtenerFacturaPorIdService,
    private readonly obtenerFacturaPorCedulaService: ObtenerFacturaPorCedulaService,
    private readonly obtenerTodasLasFacturasService: ObtenerTodasLasFacturasService,
    private readonly agregarFacturaService: AgregarFacturaService,
    private readonly obtenerFacturasPorFechaService: ObtenerFacturaPorFechaService,
    private readonly generarExelService: GenerarExelService,
    private readonly anularFacturaService: AnularFacturaService,
    private readonly obtenerFacturasAnuladasService: ObtenerFacturasAnuladasService,
  ) {}

  @ApiOperation({
    summary: 'Obtener factura por ID',
    description: 'Busca factura por su ID',
  })
  @Get('id')
  async obtenerFacturaPorId(@Query('id', ParseIntPipe) id: number) {
    try {
      if (!id) {
        throw new Error('El ID es requerido')
      }
      const factura =
        await this.obtenerFacturaPorIdService.obtenerFacturaPorId(id)
      return factura
    } catch (error) {
      Logger.error('Error al obtener factura:', error.message)
      throw new Error('Error al obtener factura: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener factura por cédula',
    description: 'Busca factura por su cédula',
  })
  @Get('cedula')
  async obtenerFacturaPorCedula(@Query('cedula') cedula: string) {
    try {
      if (!cedula) {
        throw new Error('La cédula es requerida')
      }
      const factura =
        await this.obtenerFacturaPorCedulaService.obtenerFacturasPorCedula(
          cedula,
        )
      return factura
    } catch (error) {
      Logger.error('Error al obtener factura:', error.message)
      throw new Error('Error al obtener factura: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener todas las facturas',
    description: 'Obtiene todas las facturas paginadas',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('all')
  async obtenerTodasLasFacturas(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
  ) {
    try {
      const facturas =
        await this.obtenerTodasLasFacturasService.obtenerTodasFacturas(
          page,
          limit,
        )
      return facturas
    } catch (error) {
      Logger.error('Error al obtener todas las facturas:', error.message)
      throw new Error('Error al obtener todas las facturas: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Crear facturas',
    description: 'Crear las facturas',
  })
  @Post('crear')
  async crearFactura(@Body() datosFactura: CrearFacturaDto) {
    try {
      const resultado =
        await this.agregarFacturaService.agregarFactura(datosFactura)
      return resultado
    } catch (error) {
      throw new Error('Error al crear la factura: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Autorizar facturas que no fueron recividas',
    description: 'Autorizar las facturas',
  })
  @Post('autorizar_no_recibidas/:id')
  async autorizarFactura(@Param('id', ParseIntPipe) id: number) {
    try {
      const resultado = await this.agregarFacturaService.autorizarFactura(id)
      return resultado
    } catch (error) {
      throw new Error('Error al autorizar la factura: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Autorizar facturas',
    description: 'Autorizar las facturas',
  })
  @Post('autorizar/:id')
  async autorizarFacturaElectronica(@Param('id', ParseIntPipe) id: number) {
    try {
      const resultado = await this.agregarFacturaService.autorizarFactura(
        id,
        false,
      )
      return resultado
    } catch (error) {
      throw new Error('Error al autorizar la factura: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener facturas por fecha',
    description:
      'Busca facturas en un rango de fechas o en una fecha específica',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: true,
    type: String,
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    type: String,
    example: '2025-01-31',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('fecha')
  async obtenerFacturasPorFecha(@Query() params: BuscarFacturasPorFechaDto) {
    try {
      const facturas =
        await this.obtenerFacturasPorFechaService.obtenerFacturasPorFecha(
          params,
        )
      return facturas
    } catch (error) {
      Logger.error('Error al obtener facturas por fecha:', error.message)
      throw new Error('Error al obtener facturas por fecha: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Generar reporte de todas las facturas',
    description: 'Genera un reporte de facturas en formato Excel',
  })
  @Get('reporte')
  async generarReporteFacturas(@Res() res: Response) {
    try {
      const facturas =
        await this.obtenerTodasLasFacturasService.obtenerTodasSinPaginacion()
      return this.generarExelService.generarReporteFacturas(res, facturas)
    } catch (error) {
      Logger.error('Error al generar reporte de facturas:', error.message)
      throw new Error('Error al generar reporte de facturas: ' + error.message)
    }
  }

  //por fechas
  @ApiOperation({
    summary: 'Generar reporte de todas las facturas',
    description: 'Genera un reporte de facturas en formato Excel',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: true,
    type: String,
    example: '2025-06-01',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    type: String,
    example: '2025-06-30',
  })
  @Get('reporte/fecha')
  async generarReporteFacturasFecha(
    @Res() res: Response,
    @Query() params: BuscarFacturasPorFechaDto,
  ) {
    try {
      const facturas =
        await this.obtenerFacturasPorFechaService.obtenerFacturasPorFechaSinPaginacion(
          params,
        )
      return this.generarExelService.generarReporteFacturas(res, facturas)
    } catch (error) {
      Logger.error('Error al generar reporte de facturas:', error.message)
      throw new Error('Error al generar reporte de facturas: ' + error.message)
    }
  }

  @Get('anuladas')
  @ApiOperation({
    summary: 'Obtener facturas anuladas',
    description: 'Obtiene solo las facturas que han sido anuladas',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de resultados por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de facturas anuladas obtenida correctamente',
  })
  async obtenerFacturasAnuladas(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
  ) {
    try {
      Logger.log(
        `Obteniendo facturas anuladas - página: ${page}, límite: ${limit}`,
      )
      return await this.obtenerFacturasAnuladasService.obtenerFacturasAnuladas(
        page,
        limit,
      )
    } catch (error) {
      Logger.error('Error al obtener facturas anuladas:', error.message)
      throw new Error('Error al obtener facturas anuladas: ' + error.message)
    }
  }

  @Patch(':id/anular')
  @ApiOperation({
    summary: 'Anular factura',
    description:
      'Anula una factura previamente autorizada. La factura debe estar en estado AUTORIZADO para poder ser anulada.',
  })
  @ApiResponse({
    status: 200,
    description: 'Factura anulada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description:
      'La factura no puede ser anulada (ya está anulada o no está autorizada)',
  })
  @ApiResponse({
    status: 404,
    description: 'Factura no encontrada',
  })
  async anularFactura(@Param('id', ParseIntPipe) id: number) {
    try {
      Logger.log(`Anulando factura ${id}`)
      return await this.anularFacturaService.anularFactura(id)
    } catch (error) {
      Logger.error(`Error al anular factura ${id}:`, error.message)
      throw new Error(`Error al anular factura: ${error.message}`)
    }
  }
}
