/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { MovimientosRepository } from '../base/movimientos.repository';

@Injectable()
export class BalanceGeneralService {
    constructor(
        private readonly movimientosRepo: MovimientosRepository
    ) { }

    async getBalanceGeneral(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }) {
        const movimientos = await this.movimientosRepo.getMovimientos(filtros);

        // 🔹 Agrupar por cuenta
        const cuentasMap = new Map<number, any>();

        movimientos.forEach((mov) => {
            if (!cuentasMap.has(mov.cuentaId)) {
                cuentasMap.set(mov.cuentaId, {
                    cuentaId: mov.cuentaId,
                    codigo: mov.cuenta.codigo,
                    nombre: mov.cuenta.nombre,
                    tipo: mov.cuenta.tipo,
                    naturaleza: mov.cuenta.naturaleza,
                    totalDebe: 0,
                    totalHaber: 0,
                });
            }

            const cuenta = cuentasMap.get(mov.cuentaId);

            cuenta.totalDebe += Number(mov.debe);
            cuenta.totalHaber += Number(mov.haber);
        });

        // 🔹 Calcular saldos
        const cuentas = Array.from(cuentasMap.values()).map((c) => {
            const saldo =
                c.naturaleza === 'DEUDORA'
                    ? c.totalDebe - c.totalHaber
                    : c.totalHaber - c.totalDebe;

            return {
                ...c,
                saldo,
            };
        });

        // 🔥 FILTRAR SOLO BALANCE GENERAL
        const cuentasBalance = cuentas.filter(c =>
            ['ACTIVO', 'PASIVO', 'PATRIMONIO'].includes(c.tipo)
        );

        // 🔹 Agrupar por tipo
        const activos = cuentasBalance.filter(c => c.tipo === 'ACTIVO');
        const pasivos = cuentasBalance.filter(c => c.tipo === 'PASIVO');
        const patrimonio = cuentasBalance.filter(c => c.tipo === 'PATRIMONIO');

        // 🔹 Totales
        const totalActivos = activos.reduce((acc, c) => acc + c.saldo, 0);
        const totalPasivos = pasivos.reduce((acc, c) => acc + c.saldo, 0);
        const totalPatrimonio = patrimonio.reduce((acc, c) => acc + c.saldo, 0);

        return {
            activos,
            pasivos,
            patrimonio,
            totales: {
                activos: totalActivos,
                pasivos: totalPasivos,
                patrimonio: totalPatrimonio,
                pasivoMasPatrimonio: totalPasivos + totalPatrimonio,
            },
        };
    }
}