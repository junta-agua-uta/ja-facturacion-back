import { Body, Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { EmpresaService } from './empresa.service'
import { UpdateEmpresaDto } from './dtos/update-empresa.dto'

@ApiTags('Empresa')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @ApiOperation({ summary: 'Obtener la empresa unica del sistema' })
  @Get()
  async obtenerEmpresa() {
    return this.empresaService.obtenerEmpresa()
  }

  @ApiOperation({ summary: 'Actualizar empresa por id' })
  @Put(':id')
  async actualizarEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ) {
    return this.empresaService.actualizarEmpresa(id, updateEmpresaDto)
  }
}