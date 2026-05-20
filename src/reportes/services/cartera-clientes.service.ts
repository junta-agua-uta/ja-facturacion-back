/* eslint-disable prettier/prettier */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class CarteraClientesService {
    constructor(
        private readonly prisma: PrismaClient
    ) {}

    async getCartera(filtros: {
        empresaId: number;
        clienteId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }) {

        // 🔹 1. Traer clientes de la empresa
        const clientes = await this.prisma.cLIENTES.findMany({
            where: {
                empresas: {
                    some: {
                        empresaId: filtros.empresaId,
                    },
                },
                ...(filtros.clienteId && { ID: filtros.clienteId }),
            },
            include: {
                CUENTAS: {
                    include: {
                        ABONOS: true,
                    },
                },
            },
        });

        // 🔥 2. Construir cartera
        return clientes.map(cliente => {

            let totalDebe = 0;
            let totalAbonos = 0;

            const cuentas = cliente.CUENTAS.map(cuenta => {

                const abonos = cuenta.ABONOS.reduce(
                    (acc, a) => acc + Number(a.VALOR_ABONO),
                    0
                );

                const saldo = Number(cuenta.VALOR || 0) - abonos;

                totalDebe += Number(cuenta.VALOR || 0);
                totalAbonos += abonos;

                return {
                    cuentaId: cuenta.ID,
                    fechaEmision: cuenta.FECHA_EMISION,
                    valorOriginal: Number(cuenta.VALOR || 0),
                    abonos,
                    saldo,
                    estado: cuenta.ESTADO,
                };
            });

            return {
                clienteId: cliente.ID,
                identificacion: cliente.IDENTIFICACION,
                razonSocial: cliente.RAZON_SOCIAL,
                totalDebe,
                totalAbonos,
                saldoTotal: totalDebe - totalAbonos,
                cuentas,
            };
        });
    }
}