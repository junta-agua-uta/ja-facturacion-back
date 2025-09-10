/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common'
import { PrismaClient, USUARIOS } from '@prisma/client'

@Injectable()
export class FindUserService {
  constructor(private prisma: PrismaClient) {}

  async findUserByCedula(cedula: string): Promise<USUARIOS | null> {
    const user = await this.prisma.uSUARIOS
      .findUniqueOrThrow({
        where: {
          CEDULA: cedula,
          NOT: {
            ESTADO: false,
          },
        },
      })
      .catch((error) => {
        return null
      })

    return user
  }
}
