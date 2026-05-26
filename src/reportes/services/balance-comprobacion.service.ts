/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { MovimientosRepository } from '../base/movimientos.repository';

@Injectable()
export class BalanceComprobacionService {
    constructor(
        private readonly movimientosRepo: MovimientosRepository
    ) { }

    async getBalance(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }) {
        const movimientos = await this.movimientosRepo.getMovimientos(filtros);

        const cuentas = Object.values(
            movimientos.reduce((acc, mov) => {
                const key = mov.cuentaId;

                if (!acc[key]) {
                    acc[key] = {
                        cuentaId: mov.cuentaId,
                        codigo: mov.cuenta.codigo,
                        nombre: mov.cuenta.nombre,
                        naturaleza: mov.cuenta.naturaleza,
                        totalDebe: 0,
                        totalHaber: 0,
                    };
                }

                acc[key].totalDebe += Number(mov.debe);
                acc[key].totalHaber += Number(mov.haber);

                return acc;
            }, {} as Record<number, any>)
        );

        let totalGeneralDebe = 0;
        let totalGeneralHaber = 0;

        const resultado = cuentas.map(c => {
            const saldo =
                c.naturaleza === 'DEUDORA'
                    ? c.totalDebe - c.totalHaber
                    : c.totalHaber - c.totalDebe;

            let saldoDeudor = 0;
            let saldoAcreedor = 0;

            if (c.naturaleza === 'DEUDORA') {
                const saldo = c.totalDebe - c.totalHaber;

                if (saldo >= 0) {
                    saldoDeudor = saldo;
                } else {
                    saldoAcreedor = Math.abs(saldo);
                }

            } else if (c.naturaleza === 'ACREEDORA') {
                const saldo = c.totalHaber - c.totalDebe;

                if (saldo >= 0) {
                    saldoAcreedor = saldo;
                } else {
                    saldoDeudor = Math.abs(saldo);
                }
            }
            totalGeneralDebe += c.totalDebe;
            totalGeneralHaber += c.totalHaber;
            return {
                cuentaId: c.cuentaId,
                codigo: c.codigo,
                nombre: c.nombre,
                totalDebe: c.totalDebe,
                totalHaber: c.totalHaber,
                saldoDeudor,
                saldoAcreedor,
            };
        });

        return {
            cuentas: resultado,
            totales: {
                totalDebe: totalGeneralDebe,
                totalHaber: totalGeneralHaber,
            },
        };
    }
}