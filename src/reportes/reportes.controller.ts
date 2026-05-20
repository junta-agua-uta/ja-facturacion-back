/* eslint-disable prettier/prettier */
import {
    Body,
    Controller,
    Post,
    Res,
    UseGuards,
    Logger,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { LibroMayorService } from './services/libro-mayor.service';
import { LibroMayorPdfService } from './services/libro-mayor-pdf.service';
import { LibroMayorExcelService } from './services/libro-mayor-excel.service';

import { FiltrosReporteDto } from './dtos/filtros-reporte.dto';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Rol } from '../common/decorators/role.decorator';
import { FiltrosDetalleCuentaDto } from './dtos/filtros-detalle-cuenta.dto';
import { BalanceComprobacionService } from './services/balance-comprobacion.service';
import { BalanceComprobacionPdfService } from './services/balance-comprobacion-pdf.service';
import { BalanceComprobacionExcelService } from './services/balance-comprobacion-excel.service';
import { BalanceGeneralService } from './services/balance-general.service';
import { BalanceGeneralExcelService } from './services/balance-general-excel.service';
import { BalanceGeneralPdfService } from './services/balance-general-pdf.service';
import { EstadoResultadosService } from './services/estado-resultados.service';
import { EstadoResultadosExcelService } from './services/estado-resultados-excel.service';
import { EstadoResultadosPdfService } from './services/estado-resultados-pdf.service';
import { CarteraClientesService } from './services/cartera-clientes.service';
import { CarteraClientesExcelService } from './services/cartera-clientes-excel.service';
import { CarteraClientesPdfService } from './services/cartera-clientes-pdf.service';
import { FiltrosCarteraClientesDto } from './dtos/filtros-cartera-clientes.dto';

@ApiTags('Reportes')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@Rol('ADMIN', 'CONTADOR', 'OPERADOR')
@Controller('reportes')
export class ReportesController {
    constructor(
        private readonly libroMayorService: LibroMayorService,
        private readonly libroMayorPdfService: LibroMayorPdfService,
        private readonly libroMayorExcelService: LibroMayorExcelService,
        private readonly balanceComprobacionService: BalanceComprobacionService,
        private readonly balanceComprobacionPdfService: BalanceComprobacionPdfService,
        private readonly balanceComprobacionExcelService: BalanceComprobacionExcelService,
        private readonly balanceGeneralService: BalanceGeneralService,
        private readonly balanceGeneralExcelService: BalanceGeneralExcelService,
        private readonly balanceGeneralPdfService: BalanceGeneralPdfService,
        private readonly estadoResultadosService: EstadoResultadosService,
        private readonly estadoResultadosExcelService: EstadoResultadosExcelService,
        private readonly estadoResultadosPdfService: EstadoResultadosPdfService,
        private readonly carteraClientesService: CarteraClientesService,
        private readonly carteraClientesExcelService: CarteraClientesExcelService,
        private readonly carteraClientesPdfService: CarteraClientesPdfService,
    ) { }

    @ApiOperation({ summary: 'Obtener resumen del Libro Mayor' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosReporteDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('libro-mayor/resumen')
    async obtenerResumenLibroMayor(
        @Body() filtrosDto: FiltrosReporteDto,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        return this.libroMayorService.getResumen(filtros);
    }

    @ApiOperation({ summary: 'Obtener detalle de una cuenta en el Libro Mayor' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosDetalleCuentaDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('libro-mayor/detalle')
    async obtenerDetalleCuenta(
        @Body() filtrosDto: FiltrosDetalleCuentaDto,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            cuentaId: filtrosDto.cuentaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        return this.libroMayorService.getDetalleCuenta(filtros);
    }

    @ApiOperation({ summary: 'Obtener Libro Mayor completo' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosReporteDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('libro-mayor/completo')
    async obtenerLibroMayorCompleto(
        @Body() filtrosDto: FiltrosReporteDto,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        return this.libroMayorService.getLibroMayorCompleto(filtros);
    }

    // =========================
    // 📄 LIBRO MAYOR PDF
    // =========================
    @ApiOperation({ summary: 'Exportar Libro Mayor en PDF' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosReporteDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('libro-mayor/pdf')
    async generarLibroMayorPdf(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        Logger.log('📄 Generando Libro Mayor PDF', 'ReportesController');
        Logger.log(filtrosDto);

        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        // 🔥 DATA CONTABLE
        const data = await this.libroMayorService.getLibroMayorCompleto(filtros);

        // 🔥 PDF
        const pdfBuffer =
            await this.libroMayorPdfService.generarPdfLibroMayor(
                filtros.empresaId,
                data,
                filtros,
            );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="libro-mayor.pdf"',
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    // =========================
    // 📊 LIBRO MAYOR EXCEL
    // =========================
    @ApiOperation({ summary: 'Exportar Libro Mayor en Excel' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosReporteDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('libro-mayor/excel')
    async generarLibroMayorExcel(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        Logger.log('📊 Generando Libro Mayor Excel', 'ReportesController');
        Logger.log(filtrosDto);

        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        const buffer =
            await this.libroMayorExcelService.generarExcelLibroMayor(filtros);

        res.set({
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition':
                'attachment; filename="libro-mayor.xlsx"',
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    /** LIBRO MAYOR */
    @ApiOperation({ summary: 'Obtener Balance de Comprobación' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosReporteDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('balance-comprobacion')
    async obtenerBalance(
        @Body() filtrosDto: FiltrosReporteDto,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio ? new Date(filtrosDto.fechaInicio) : undefined,
            fechaFin: filtrosDto.fechaFin ? new Date(filtrosDto.fechaFin) : undefined,
        };

        return this.balanceComprobacionService.getBalance(filtros);
    }
    @ApiOperation({ summary: 'Exportar Balance de Comprobación en PDF' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosReporteDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('balance-comprobacion/pdf')
    async exportarBalancePdf(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio ? new Date(filtrosDto.fechaInicio) : undefined,
            fechaFin: filtrosDto.fechaFin ? new Date(filtrosDto.fechaFin) : undefined,
        };

        const data = await this.balanceComprobacionService.getBalance(filtros);

        const buffer = await this.balanceComprobacionPdfService.generarPdfBalanceComprobacion(
            filtros.empresaId,
            data,
            filtros,
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="balance-comprobacion.pdf"',
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @ApiOperation({ summary: 'Exportar Balance de Comprobación en Excel' })
    // @ApiBearerAuth('access-token')
    @ApiBody({ type: FiltrosReporteDto })
    // @UseGuards(AuthGuard, RoleGuard)
    // @Rol('CONTADOR')
    @Post('balance-comprobacion/excel')
    async exportarBalanceExcel(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio ? new Date(filtrosDto.fechaInicio) : undefined,
            fechaFin: filtrosDto.fechaFin ? new Date(filtrosDto.fechaFin) : undefined,
        };

        const buffer = await this.balanceComprobacionExcelService.generarExcelBalanceComprobacion(filtros);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="balance-comprobacion.xlsx"',
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    // En ReportesController, agregar:

    // =========================
    // 📊 BALANCE GENERAL EXCEL
    // =========================
    @ApiOperation({ summary: 'Exportar Balance General en Excel' })
    @ApiBody({ type: FiltrosReporteDto })
    @Post('balance-general/excel')
    async generarBalanceGeneralExcel(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        Logger.log('📊 Generando Balance General Excel', 'ReportesController');

        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        const buffer = await this.balanceGeneralExcelService.generarExcelBalanceGeneral(filtros);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="balance-general.xlsx"',
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    // =========================
    // 📄 BALANCE GENERAL PDF
    // =========================
    @ApiOperation({ summary: 'Exportar Balance General en PDF' })
    @ApiBody({ type: FiltrosReporteDto })
    @Post('balance-general/pdf')
    async generarBalanceGeneralPdf(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        Logger.log('📄 Generando Balance General PDF', 'ReportesController');

        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        const data = await this.balanceGeneralService.getBalanceGeneral(filtros);

        const pdfBuffer = await this.balanceGeneralPdfService.generarPdfBalanceGeneral(
            filtros.empresaId,
            data,
            filtros,
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="balance-general.pdf"',
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    // =========================
    // 📋 BALANCE GENERAL JSON (opcional)
    // =========================
    @ApiOperation({ summary: 'Obtener Balance General en JSON' })
    @ApiBody({ type: FiltrosReporteDto })
    @Post('balance-general')
    async obtenerBalanceGeneral(
        @Body() filtrosDto: FiltrosReporteDto,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        return this.balanceGeneralService.getBalanceGeneral(filtros);
    }

    // En ReportesController, agregar:

    // =========================
    // 📊 ESTADO DE RESULTADOS EXCEL
    // =========================
    @ApiOperation({ summary: 'Exportar Estado de Resultados en Excel' })
    @ApiBody({ type: FiltrosReporteDto })
    @Post('estado-resultados/excel')
    async generarEstadoResultadosExcel(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        Logger.log('📊 Generando Estado de Resultados Excel', 'ReportesController');

        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        const buffer = await this.estadoResultadosExcelService.generarExcelEstadoResultados(filtros);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="estado-resultados.xlsx"',
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    // =========================
    // 📄 ESTADO DE RESULTADOS PDF
    // =========================
    @ApiOperation({ summary: 'Exportar Estado de Resultados en PDF' })
    @ApiBody({ type: FiltrosReporteDto })
    @Post('estado-resultados/pdf')
    async generarEstadoResultadosPdf(
        @Body() filtrosDto: FiltrosReporteDto,
        @Res() res: Response,
    ) {
        Logger.log('📄 Generando Estado de Resultados PDF', 'ReportesController');

        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        const data = await this.estadoResultadosService.getEstadoResultados(filtros);

        const pdfBuffer = await this.estadoResultadosPdfService.generarPdfEstadoResultados(
            filtros.empresaId,
            data,
            filtros,
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="estado-resultados.pdf"',
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    // =========================
    // 📋 ESTADO DE RESULTADOS JSON (opcional)
    // =========================
    @ApiOperation({ summary: 'Obtener Estado de Resultados en JSON' })
    @ApiBody({ type: FiltrosReporteDto })
    @Post('estado-resultados')
    async obtenerEstadoResultados(
        @Body() filtrosDto: FiltrosReporteDto,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            periodoId: filtrosDto.periodoId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        return this.estadoResultadosService.getEstadoResultados(filtros);
    }
    // En ReportesController, agregar:

    // =========================
    // 📊 CARTERA DE CLIENTES EXCEL
    // =========================
    @ApiOperation({ summary: 'Exportar Cartera de Clientes en Excel' })
    @ApiBody({ type: FiltrosCarteraClientesDto })
    @Post('cartera-clientes/excel')
    async generarCarteraClientesExcel(
        @Body() filtrosDto: FiltrosCarteraClientesDto,
        @Res() res: Response,
    ) {
        Logger.log('📊 Generando Cartera de Clientes Excel', 'ReportesController');

        const filtros = {
            empresaId: filtrosDto.empresaId,
            clienteId: filtrosDto.clienteId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        const buffer = await this.carteraClientesExcelService.generarExcelCarteraClientes(filtros);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="cartera-clientes.xlsx"',
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    // =========================
    // 📄 CARTERA DE CLIENTES PDF
    // =========================
    @ApiOperation({ summary: 'Exportar Cartera de Clientes en PDF' })
    @ApiBody({ type: FiltrosCarteraClientesDto })
    @Post('cartera-clientes/pdf')
    async generarCarteraClientesPdf(
        @Body() filtrosDto: FiltrosCarteraClientesDto,
        @Res() res: Response,
    ) {
        Logger.log('📄 Generando Cartera de Clientes PDF', 'ReportesController');

        const filtros = {
            empresaId: filtrosDto.empresaId,
            clienteId: filtrosDto.clienteId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        const data = await this.carteraClientesService.getCartera(filtros);

        const pdfBuffer = await this.carteraClientesPdfService.generarPdfCarteraClientes(
            filtros.empresaId,
            data,
            filtros,
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="cartera-clientes.pdf"',
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    // =========================
    // 📋 CARTERA DE CLIENTES JSON (opcional)
    // =========================
    @ApiOperation({ summary: 'Obtener Cartera de Clientes en JSON' })
    @ApiBody({ type: FiltrosCarteraClientesDto })
    @Post('cartera-clientes')
    async obtenerCarteraClientes(
        @Body() filtrosDto: FiltrosCarteraClientesDto,
    ) {
        const filtros = {
            empresaId: filtrosDto.empresaId,
            clienteId: filtrosDto.clienteId,
            fechaInicio: filtrosDto.fechaInicio
                ? new Date(filtrosDto.fechaInicio)
                : undefined,
            fechaFin: filtrosDto.fechaFin
                ? new Date(filtrosDto.fechaFin)
                : undefined,
        };

        return this.carteraClientesService.getCartera(filtros);
    }
}
