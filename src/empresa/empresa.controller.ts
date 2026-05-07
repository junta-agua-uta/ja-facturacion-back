import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { EmpresaService } from './empresa.service'
import { UpdateEmpresaDto } from './dtos/update-empresa.dto'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { RoleGuard } from 'src/auth/guards/role.guard'
import { Rol } from 'src/common/decorators/role.decorator'

@ApiTags('Empresa')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @ApiOperation({ summary: 'Obtener la empresa unica del sistema' })
  @Get()
  @Rol('ADMIN', 'CONTADOR')
  async obtenerEmpresa() {
    return this.empresaService.obtenerEmpresa()
  }

  @ApiOperation({ summary: 'Actualizar empresa por id' })
  @Rol('ADMIN', 'CONTADOR')
  @Put(':id')
  async actualizarEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ) {
    return this.empresaService.actualizarEmpresa(id, updateEmpresaDto)
  }
}
