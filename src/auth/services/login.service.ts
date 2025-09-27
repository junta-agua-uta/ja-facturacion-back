/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaClient, ROL } from '@prisma/client'
import { LoginUserDto } from '../dtos/login.dto'
import { FindUserService } from './findUserByCedula.service'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class LoginService {
  constructor(
    private jwtService: JwtService,
    private findByCedulaService: FindUserService,
  ) {}

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const validate = await this.validateUser(loginUserDto)
    Logger.log('--------------------')
    Logger.log(validate)

    if (!validate) {
      throw new HttpException('Credenciales Invalidas', HttpStatus.UNAUTHORIZED)
    }

    const payload = {
      cedula: validate.CEDULA,
      id: validate.ID,
      rol: validate.ROL,
    }

    const token = this.jwtService.sign(payload)

    return {
      access_token: token,
    }
  }

  async validateUser(loginUserDto: LoginUserDto): Promise<{
    CEDULA: string
    ID: number
    ROL: ROL
    NOMBRE: string
    APELLIDO: string
    CORREO: string
    ESTADO: boolean
    FECHA_CREACION: Date | null
  } | null> {
    console.log(loginUserDto)
    const user = await this.findByCedulaService.findUserByCedula(
      loginUserDto.cedula,
    )
    console.log(user)
    if (user && (await bcrypt.compare(loginUserDto.password, user.HASH))) {
      const { HASH, SALT, ...result } = user

      return result
    }
    return null
  }
}
