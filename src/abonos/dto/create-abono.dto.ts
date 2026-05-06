import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsInt, IsEnum, Min } from 'class-validator';

export class CreateAbonoDto {
  @ApiProperty({ example: 1, description: 'ID de la cuenta por cobrar (CUENTAS) a la cual se abona' })
  @IsInt()
  idCuenta: number;

  @ApiProperty({ example: 50.00, description: 'Valor del abono' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valorAbono: number;

  @ApiProperty({ example: 'Abono de factura de enero', description: 'Descripción o concepto del abono' })
  @IsString()
  descripcion: string;

  @ApiProperty({ example: 'EFECTIVO', description: 'Método de pago del abono', enum: ['EFECTIVO', 'TRANSFERENCIA'] })
  @IsEnum(['EFECTIVO', 'TRANSFERENCIA'])
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA';

  @ApiProperty({ example: 1, description: 'ID del usuario que registra el abono' })
  @IsInt()
  usuarioId: number;

  @ApiProperty({ example: 1, description: 'ID de la empresa (para la contabilidad)' })
  @IsInt()
  empresaId: number;
}
