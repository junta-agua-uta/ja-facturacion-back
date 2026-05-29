import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { RoleGuard } from 'src/auth/guards/role.guard'
import { Rol } from 'src/common/decorators/role.decorator'

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiOperation({ summary: 'Listar a los usuarios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Rol('ADMIN', 'CONTADOR')
  @Get()
  async listarUsuarios(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.usersService.listarUsuarios(
      Number(page) || 1,
      Number(limit) || 10,
    )
  }

  @ApiOperation({ summary: 'Listar a los usuarios dada una empresa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiParam({
    name: 'empresaId',
    description: 'ID de la empresa',
    type: Number,
  })
  @Rol('ADMIN', 'CONTADOR')
  @Get('empresa/:empresaId')
  async listarUsuariosPorEmpresa(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.usersService.listarUsuariosPorEmpresa(
      empresaId,
      Number(page) || 1,
      Number(limit) || 10,
    )
  }
}
