import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ConfigAsientosAutoService } from './config-asientos-auto.service'

@ApiTags('Config Asientos Automaticos')
@Controller('config-asientos-auto')
export class ConfigAsientosAutoController {
  constructor(
    private readonly configAsientosAutoService: ConfigAsientosAutoService,
  ) {}

  @ApiOperation({ summary: 'Obtener configuracion de asientos automaticos' })
  @ApiQuery({ name: 'empresaId', required: false, type: Number })
  @ApiQuery({ name: 'tipoTransaccion', required: false, type: String })
  @Get()
  async obtenerConfiguracion(
    @Query('empresaId', new DefaultValuePipe('1'), ParseIntPipe)
    empresaId: number,
    @Query('tipoTransaccion') tipoTransaccion?: string,
  ) {
    return this.configAsientosAutoService.obtenerConfiguracion(
      empresaId,
      tipoTransaccion,
    )
  }
}