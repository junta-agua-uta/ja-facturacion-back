import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { CrudSucursalesService } from './services/crudSucursales.service'
import { SucursalesService } from './services/obtenerSucursales.service'
import { CrearSucursalDto } from './dtos/crearSucursal.dto'
import { EditarSucursalDto } from './dtos/editarSucursal.dto'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from 'src/auth/guards/auth.guard'

@ApiTags('Sucursales')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('sucursales')
export class SucursalesController {
  constructor(
    private readonly sucursalesService: SucursalesService,
    private readonly crudSucursalesService: CrudSucursalesService,
  ) {}

  @ApiOperation({
    summary: 'Obtener todas las sucursales',
    description: 'Obtiene todas las sucursales registradas',
  })
  @Get()
  async obtenerSucursales() {
    try {
      const sucursales = await this.sucursalesService.obtenerTodasSucursales()
      return sucursales
    } catch (error) {
      throw new Error('Error al obtener sucursales: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Obtener sucursal por ID',
    description: 'Busca sucursal por su ID',
  })
  @Get(':id')
  async obtenerSucursalPorId(@Param('id') id: string) {
    try {
      if (!id) {
        throw new Error('El ID de la sucursal es requerido')
      }

      const sucursal = await this.crudSucursalesService.obtenerSucursalPorId(
        parseInt(id, 10),
      )
      return sucursal
    } catch (error) {
      throw new Error('Error al buscar sucursal: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Crear sucursal',
    description: 'Crea una nueva sucursal',
  })
  @Post()
  async crearSucursal(@Body() sucursalData: CrearSucursalDto) {
    try {
      const sucursalCreada =
        await this.crudSucursalesService.crearSucursal(sucursalData)
      return sucursalCreada
    } catch (error) {
      throw new Error('Error al crear sucursal: ' + error.message)
    }
  }

  @ApiOperation({
    summary: 'Editar sucursal',
    description: 'Edita una sucursal existente',
  })
  @Put(':id')
  async editarSucursal(
    @Param('id') id: string,
    @Body() sucursalData: EditarSucursalDto,
  ) {
    try {
      const sucursalEditada = await this.crudSucursalesService.editarSucursal(
        parseInt(id, 10),
        sucursalData,
      )
      return sucursalEditada
    } catch (error) {
      throw new Error('Error al editar sucursal: ' + error.message)
    }
  }
}
