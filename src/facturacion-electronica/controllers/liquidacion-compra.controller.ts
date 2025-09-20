import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LiquidacionCompraInputDto } from '../dto/liquidacion-compra.dto';
import { ElectronicLiquidacionService } from '../services/electronic-liquidacion.service';

@ApiTags('Liquidación de Compra')
@Controller('liquidacion-compra')
export class LiquidacionCompraController {
  private readonly logger = new Logger(LiquidacionCompraController.name);

  constructor(private readonly service: ElectronicLiquidacionService) {}

  @Post('crear')
  @ApiOperation({ summary: 'Crear y enviar liquidación de compra al SRI' })
  @ApiResponse({ status: 200, description: 'Liquidación creada y enviada al SRI' })
  async crearYEnviar(@Body() dto: LiquidacionCompraInputDto) {
    this.logger.log('Recibiendo request para crear y enviar liquidación');
    return this.service.enviarAlSRI(dto, 'proveedor@empresa.com');
  }

  @Get('autorizar/:accessKey')
  @ApiOperation({ summary: 'Consultar autorización del SRI por clave de acceso' })
  async autorizarPorClave(@Param('accessKey') accessKey: string) {
    return this.service.autorizarPorClave(accessKey);
  }
}
