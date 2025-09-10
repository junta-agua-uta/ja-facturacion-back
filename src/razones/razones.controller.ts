import {
  Controller,
  Get,
  Query,
  Logger,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common'
import { RazonesService } from './crudRazones.service'
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'

@ApiTags('Razones')
/* @ApiBearerAuth('access-token')
@UseGuards(AuthGuard) */
@Controller('razones')
export class RazonesController {
  constructor(private readonly razonesService: RazonesService) {}

  @ApiOperation({
    summary: 'Obtener todas las razones',
    description: 'Obtiene una lista paginada de todas las razones',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página para la paginación',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de razones obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ID: { type: 'integer', example: 1 },
              CODIGO: { type: 'string', example: 'R001' },
              RAZON: { type: 'string', example: 'Consumo de agua' },
              PRECIO1: { type: 'string', example: '10.50' },
              PRECIO2: { type: 'string', example: '12.00' },
              IVA: { type: 'string', example: '12' },
            },
          },
        },
        totalItems: { type: 'integer', example: 50 },
        totalPages: { type: 'integer', example: 5 },
        currentPage: { type: 'integer', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la solicitud',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @Get()
  async obtenerRazones(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit: number,
  ) {
    try {
      const razones = await this.razonesService.obtenerRazones(page, limit)
      return razones
    } catch (error) {
      Logger.error('Error al obtener razones:', error.message)
      throw new Error('Error al obtener razones: ' + error.message)
    }
  }
}
