import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { RegisterService } from './services/register.service'
import { LoginService } from './services/login.service'
import { LoginUserDto } from './dtos/login.dto'
import { RegisterAuthDto } from './dtos/register.dto'
import { Response } from 'express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Rol } from 'src/common/decorators/role.decorator'
import { AuthGuard } from './guards/auth.guard'
import { RoleGuard } from './guards/role.guard'
import { FindUserService } from './services/findUserByCedula.service'
import { DateUtil } from 'src/common/utils/date.util'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterService,
    private readonly login: LoginService,
    private readonly me: FindUserService,
    // private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({
    summary: 'Login',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async logUser(
    @Res() response: Response,
    @Body() logUserDto: LoginUserDto,
  ): Promise<Response> {
    const userLogged: { access_token: string } =
      await this.login.login(logUserDto)

    // const decodedToken = this.jwtService.decode(userLogged.access_token);
    // Logger.log(decodedToken);

    return response.status(HttpStatus.OK).json(userLogged)
  }

  // @Rol('ADMIN')
  // @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({
    summary: 'Registrar usuario',
  })
  // @ApiBearerAuth('access-token')
  @Post('/register')
  async registerUser(
    @Res() response: Response,
    @Body() user: RegisterAuthDto,
  ): Promise<Response> {
    const userCreated = await this.register.register(user)
    return response.status(HttpStatus.CREATED).json(userCreated)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Obtener usuario',
  })
  @ApiBearerAuth('access-token')
  @Get('/me')
  async getUserByDni(@Res() response: Response, @Req() req): Promise<Response> {
    const cedula = req.user?.cedula
    const userCreated = await this.me.findUserByCedula(cedula as string)
    return response.status(HttpStatus.CREATED).json(userCreated)
  }

  @ApiOperation({
    summary: 'Verificar funcionamiento de la API',
  })
  @Get()
  helloWorld(@Res() response: Response): Promise<Response> {
    Logger.log(DateUtil.getCurrentDate())
    return Promise.resolve(
      response.status(HttpStatus.OK).json({ message: 'Hello World' }),
    )
  }
}
