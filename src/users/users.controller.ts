import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { UsersService } from './users.service'
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔹 GET /users?page=1&limit=10
  @ApiOperation({ summary: 'Listar a los usuarios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
