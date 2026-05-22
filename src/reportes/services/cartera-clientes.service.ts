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

        const fechaCuentaWhere: any = {};
        if (filtros.fechaInicio) fechaCuentaWhere.gte = filtros.fechaInicio;
        if (filtros.fechaFin) fechaCuentaWhere.lte = filtros.fechaFin;

        const fechaAbonoWhere: any = {};
        if (filtros.fechaInicio) fechaAbonoWhere.gte = filtros.fechaInicio;
        if (filtros.fechaFin) fechaAbonoWhere.lte = filtros.fechaFin;

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
                    where: Object.keys(fechaCuentaWhere).length > 0 ? { FECHA_EMISION: fechaCuentaWhere } : undefined,
                    include: {
                        ABONOS: {
                            where: Object.keys(fechaAbonoWhere).length > 0 ? { FECHA_ABONO: fechaAbonoWhere } : undefined,
                        },
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