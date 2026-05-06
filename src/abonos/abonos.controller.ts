import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AbonosService } from './abonos.service';
import { CreateAbonoDto } from './dto/create-abono.dto';

@ApiTags('Abonos')
@Controller('abonos')
export class AbonosController {
  constructor(private readonly abonosService: AbonosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo abono y generar su asiento contable' })
  @ApiResponse({ status: 201, description: 'Abono registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada.' })
  async crearAbono(@Body() data: CreateAbonoDto) {
    return this.abonosService.crearAbono(data);
  }

  @Get('cuenta/:idCuenta')
  @ApiOperation({ summary: 'Listar todos los abonos de una cuenta específica' })
  @ApiResponse({ status: 200, description: 'Lista de abonos obtenida correctamente.' })
  async listarAbonosDeCuenta(@Param('idCuenta', ParseIntPipe) idCuenta: number) {
    return this.abonosService.listarAbonosDeCuenta(idCuenta);
  }
}
