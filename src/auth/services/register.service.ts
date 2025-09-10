/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, Injectable } from '@nestjs/common'
import { RegisterAuthDto } from '../dtos/register.dto'
import { PrismaClient, USUARIOS } from '@prisma/client'

@Injectable()
export class RegisterService {
  constructor(private prisma: PrismaClient) {}

  async register(registerAuth: RegisterAuthDto): Promise<USUARIOS> {
    return this.prisma.uSUARIOS
      .create({
        data: {
          CEDULA: registerAuth.cedula,
          NOMBRE: registerAuth.nombre,
          APELLIDO: registerAuth.apellido,
          CORREO: registerAuth.correo,
          HASH: registerAuth.hash!,
          SALT: registerAuth.salt!,
          ROL: registerAuth.rol,
        },
      })
      .catch((error) => {
        if (error.code === 'P2002') {
          throw new HttpException('El usuario ya existe', 400)
        }
        return error
      })
  }
}
