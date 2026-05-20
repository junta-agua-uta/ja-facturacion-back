/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { MovimientosRepository } from '../base/movimientos.repository';

@Injectable()
export class LibroMayorService {
    constructor(
        private readonly movimientosRepo: MovimientosRepository
    ) { }

    async getResumen(filtros: {
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

        return cuentas.map(c => {
            const saldo =
                c.naturaleza === 'DEUDORA'
                    ? c.totalDebe - c.totalHaber
                    : c.totalHaber - c.totalDebe;

            return {
                cuentaId: c.cuentaId,
                codigo: c.codigo,
                nombre: c.nombre,
                totalDebe: c.totalDebe,
                totalHaber: c.totalHaber,
                saldo,
            };
        });
    }

    async getDetalleCuenta(filtros: {
        empresaId: number;
        cuentaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }) {
        const movimientos = await this.movimientosRepo.getMovimientos(filtros);

        const movimientosCuenta = movimientos
            .filter(m => m.cuentaId === filtros.cuentaId)
            .map(m => ({
                fecha: m.asiento.fecha,
                numero: m.asiento.numero,
                concepto: m.asiento.concepto,
                debe: Number(m.debe),
                haber: Number(m.haber),
            }));

        // 🔥 saldo progresivo (esto es clave en libro mayor real)
        let saldoAcumulado = 0;

        const cuenta = movimientos.find(m => m.cuentaId === filtros.cuentaId)?.cuenta;

        const detalleConSaldo = movimientosCuenta.map(mov => {
            if (cuenta.naturaleza === 'DEUDORA') {
                saldoAcumulado += mov.debe - mov.haber;
            } else {
                saldoAcumulado += mov.haber - mov.debe;
            }

            return {
                ...mov,
                saldo: saldoAcumulado,
            };
        });

        return {
            cuentaId: filtros.cuentaId,
            codigo: cuenta?.codigo,
            nombre: cuenta?.nombre,
            movimientos: detalleConSaldo,
        };
    }
    async getLibroMayorCompleto(filtros: {
        empresaId: number;
        periodoId?: number;
        fechaInicio?: Date;
        fechaFin?: Date;
    }) {
        const movimientos = await this.movimientosRepo.getMovimientos(filtros);

        const cuentasMap = new Map<number, any>();

        movimientos.forEach((mov) => {
            if (!cuentasMap.has(mov.cuentaId)) {
                cuentasMap.set(mov.cuentaId, {
                    cuentaId: mov.cuentaId,
                    codigo: mov.cuenta.codigo,
                    nombre: mov.cuenta.nombre,
                    naturaleza: mov.cuenta.naturaleza,
                    movimientos: [],
                });
            }

            cuentasMap.get(mov.cuentaId).movimientos.push({
                fecha: mov.asiento.fecha,
                numero: mov.asiento.numero,
                concepto: mov.asiento.concepto,
                debe: Number(mov.debe),
                haber: Number(mov.haber),
            });
        });

        // 🔥 calcular saldo progresivo por cuenta
        return Array.from(cuentasMap.values()).map((cuenta) => {
            let saldo = 0;

            cuenta.movimientos = cuenta.movimientos.map((mov) => {
                if (cuenta.naturaleza === 'DEUDORA') {
                    saldo += mov.debe - mov.haber;
                } else {
                    saldo += mov.haber - mov.debe;
                }

                return {
                    ...mov,
                    saldo,
                };
            });

            return cuenta;
        });
    }
}