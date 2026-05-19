/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client'
import { Injectable } from '@nestjs/common';

@Injectable()
export class MovimientosRepository {
    constructor(
        private readonly prisma: PrismaClient
    ) { }

    async getMovimientos(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }) {
        return this.prisma.detalleAsiento.findMany({
            where: {
                asiento: {
                    estado: 'APROBADO',
                    periodo: {
                        empresaId: filtros.empresaId,
                    },
                    ...(filtros.periodoId && {
                        periodoId: filtros.periodoId,
                    }),
                    ...(filtros.fechaInicio && filtros.fechaFin && {
                        fecha: {
                            gte: filtros.fechaInicio,
                            lte: filtros.fechaFin,
                        },
                    }),
                },
            },
            include: {
                cuenta: true,
                asiento: {
                    include: {
                        periodo: true,
                    },
                },
            },
            orderBy: [
                { cuenta: { codigo: 'asc' } },
                { asiento: { fecha: 'asc' } },
            ],
        });
    }
}