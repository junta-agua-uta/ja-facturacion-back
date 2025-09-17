import { Controller, Post, Body, Get, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GenerateLiquidacionCompraService } from '../services/generate-liquidacion-compra.service'
import { LiquidacionCompraInputDto } from '../dto/liquidacion-compra.dto'

@ApiTags('Liquidación de Compra')
@Controller('liquidacion-compra')
export class LiquidacionCompraController {
  constructor(
    private readonly generateLiquidacionCompraService: GenerateLiquidacionCompraService,
  ) {}

  @ApiOperation({
    summary: 'Generar XML de liquidación de compra',
    description: 'Genera el XML para una liquidación de compra de bienes y prestación de servicios',
  })
  @ApiResponse({
    status: 200,
    description: 'XML de liquidación de compra generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        xml: { type: 'string', description: 'XML de la liquidación de compra' },
        accessKey: { type: 'string', description: 'Clave de acceso generada' },
      },
    },
  })
  @Post('generar-xml')
  async generarXmlLiquidacionCompra(
    @Body() liquidacionData: LiquidacionCompraInputDto,
  ) {
    try {
      Logger.log('Generando XML de liquidación de compra...')
      
      const result = this.generateLiquidacionCompraService.generateLiquidacionCompra(
        liquidacionData,
        'proveedor@empresa.com', // Email del proveedor
      )

      Logger.log('XML de liquidación de compra generado exitosamente')
      
      return {
        success: true,
        message: 'XML de liquidación de compra generado exitosamente',
        data: {
          xml: result.xml,
          accessKey: result.accessKey,
        },
      }
    } catch (error) {
      Logger.error('Error al generar XML de liquidación de compra:', error.message)
      throw new Error('Error al generar XML de liquidación de compra: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener ejemplo de liquidación de compra',
    description: 'Retorna un ejemplo de estructura para liquidación de compra',
  })
  @ApiResponse({
    status: 200,
    description: 'Ejemplo de liquidación de compra obtenido exitosamente',
  })
  @Get('ejemplo')
  async obtenerEjemploLiquidacionCompra() {
    try {
      Logger.log('Generando ejemplo de liquidación de compra...')
      
      const ejemplo = this.generateLiquidacionCompraService.createExampleLiquidacionCompra()
      
      Logger.log('Ejemplo de liquidación de compra generado exitosamente')
      
      return {
        success: true,
        message: 'Ejemplo de liquidación de compra obtenido exitosamente',
        data: ejemplo,
      }
    } catch (error) {
      Logger.error('Error al generar ejemplo de liquidación de compra:', error.message)
      throw new Error('Error al generar ejemplo de liquidación de compra: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Generar XML de ejemplo de liquidación de compra',
    description: 'Genera el XML de un ejemplo de liquidación de compra',
  })
  @ApiResponse({
    status: 200,
    description: 'XML de ejemplo de liquidación de compra generado exitosamente',
  })
  @Get('ejemplo-xml')
  async generarEjemploXmlLiquidacionCompra() {
    try {
      Logger.log('Generando XML de ejemplo de liquidación de compra...')
      
      const ejemplo = this.generateLiquidacionCompraService.createExampleLiquidacionCompra()
      const result = this.generateLiquidacionCompraService.generateLiquidacionCompra(
        ejemplo,
        'proveedor@empresa.com',
      )
      
      Logger.log('XML de ejemplo de liquidación de compra generado exitosamente')
      
      return {
        success: true,
        message: 'XML de ejemplo de liquidación de compra generado exitosamente',
        data: {
          xml: result.xml,
          accessKey: result.accessKey,
        },
      }
    } catch (error) {
      Logger.error('Error al generar XML de ejemplo de liquidación de compra:', error.message)
      throw new Error('Error al generar XML de ejemplo de liquidación de compra: ' + error.message)
    }
  }
}
