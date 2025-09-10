import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  //VERIFICA SI EL TOKEN ES VALIDO CON LA CONTRASENIA SETEADA EN EL .ENV
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request as Request)
    if (!token) {
      throw new UnauthorizedException('No existe el token')
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      })

      request['user'] = payload
    } catch {
      throw new UnauthorizedException('Error al verificar el token')
    }
    return true
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    //Logger.log(request.headers.authorization)
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
