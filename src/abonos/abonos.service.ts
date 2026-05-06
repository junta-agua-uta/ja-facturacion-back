import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsientoAutomaticoService } from '../asientos/asiento-automatico.service';
import { CreateAbonoDto } from './dto/create-abono.dto';

@Injectable()
export class AbonosService {
  private readonly logger = new Logger(AbonosService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly asientoAutomaticoService: AsientoAutomaticoService,
  ) {}

  async crearAbono(data: CreateAbonoDto) {
    const cuenta = await this.prisma.cUENTAS.findUnique({
      where: { ID: data.idCuenta },
    });

    if (!cuenta) {
      throw new NotFoundException('La cuenta especificada no existe.');
    }


    const ultimoAbono = await this.prisma.aBONOS.findFirst({
      orderBy: { ID: 'desc' },
    });
    const siguienteId = ultimoAbono ? ultimoAbono.ID + 1 : 1;
    const codigoAbono = `AB-${String(siguienteId).padStart(5, '0')}`;


    const abono = await this.prisma.aBONOS.create({
      data: {
        VALOR_ABONO: data.valorAbono,
        CODIGO: codigoAbono,
        DESCRIPCION: data.descripcion,
        ID_CUENTA: data.idCuenta,
      },
      include: {
        cuenta: {
          include: {
            cliente: true,
          },
        },
      },
    });


    try {
      const tipoTransaccion = data.metodoPago === 'EFECTIVO' ? 'ABONO_EFECTIVO' : 'ABONO_TRANSFERENCIA';

      await this.asientoAutomaticoService.generarAsientoAutomatico({
        tipoTransaccion,
        empresaId: data.empresaId,
        usuarioId: data.usuarioId,
        fecha: new Date(),
        montoBase: data.valorAbono,
        montoIva: 0,
        montoTotal: data.valorAbono,
        concepto: `Abono ${codigoAbono} - ${data.descripcion}`,
        referencia: codigoAbono,
        abonoId: abono.ID,
      });

      this.logger.log(`Asiento contable automático generado para el abono ID: ${abono.ID}`);
    } catch (error) {

      this.logger.warn(`El abono ${abono.ID} fue creado pero falló la generación del asiento: ${error.message}`);
    }

    return abono;
  }

  async listarAbonosDeCuenta(idCuenta: number) {
    const cuenta = await this.prisma.cUENTAS.findUnique({
      where: { ID: idCuenta },
    });

    if (!cuenta) {
      throw new NotFoundException('La cuenta especificada no existe.');
    }

    return this.prisma.aBONOS.findMany({
      where: { ID_CUENTA: idCuenta },
      orderBy: { FECHA_ABONO: 'desc' },
      include: {
        asiento: {
          select: { id: true, numero: true, estado: true, descuadre: true },
        },
      },
    });
  }
}
