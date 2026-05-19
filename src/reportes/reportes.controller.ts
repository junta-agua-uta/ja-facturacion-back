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

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
    constructor(
        private readonly libroMayorService: LibroMayorService,
        private readonly libroMayorPdfService: LibroMayorPdfService,
        private readonly libroMayorExcelService: LibroMayorExcelService,
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
}