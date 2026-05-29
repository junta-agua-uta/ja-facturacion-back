import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { UpdateEmpresaDto } from './dtos/update-empresa.dto'

@Injectable()
export class EmpresaService {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerEmpresa() {
    const empresa = await this.prisma.empresa.findFirst({
      orderBy: { id: 'asc' },
    })

    if (!empresa) {
      throw new NotFoundException('No existe una empresa configurada')
    }

    return empresa
  }

  async actualizarEmpresa(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
    })

    if (!empresa) {
      throw new NotFoundException('No existe una empresa configurada')
    }

    return this.prisma.empresa.update({
      where: { id },
      data: updateEmpresaDto,
    })
  }
}