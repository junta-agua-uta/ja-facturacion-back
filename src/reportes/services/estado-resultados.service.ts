/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { MovimientosRepository } from '../base/movimientos.repository';

@Injectable()
export class EstadoResultadosService {
    constructor(
        private readonly movimientosRepo: MovimientosRepository
    ) { }

    async getEstadoResultados(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }) {
        const movimientos = await this.movimientosRepo.getMovimientos(filtros);

        const cuentasMap = new Map<number, any>();

        // 🔹 Agrupar por cuenta
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

        // 🔥 FILTRAR SOLO INGRESOS Y GASTOS
        const ingresos = cuentas.filter(c => c.tipo === 'INGRESO');
        const gastos = cuentas.filter(c => c.tipo === 'GASTO');

        // 🔹 Totales
        const totalIngresos = ingresos.reduce((acc, c) => acc + c.saldo, 0);
        const totalGastos = gastos.reduce((acc, c) => acc + c.saldo, 0);

        const utilidad = totalIngresos - totalGastos;

        return {
            ingresos,
            gastos,
            totales: {
                ingresos: totalIngresos,
                gastos: totalGastos,
                utilidad,
            },
        };
    }
}