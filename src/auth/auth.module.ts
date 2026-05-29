import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { RegisterService } from './services/register.service'
import { AuthMiddleware } from './middleware/auth.middleware'
import { LoginService } from './services/login.service'
import { FindUserService } from './services/findUserByCedula.service'
import { UpdateUserService } from './services/updateUser.service'

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    RegisterService,
    LoginService,
    FindUserService,
    UpdateUserService,
  ],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: '/auth/change-password', method: RequestMethod.PATCH },
        { path: '/auth/profile', method: RequestMethod.PATCH },
        { path: '/auth/register', method: RequestMethod.POST },
      )
  }
}
