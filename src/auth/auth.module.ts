import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { RegisterService } from './services/register.service'
import { AuthMiddleware } from './middleware/auth.middleware'
import { LoginService } from './services/login.service'
import { FindUserService } from './services/findUserByCedula.service'

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [RegisterService, LoginService, FindUserService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/auth/register', method: RequestMethod.POST })
  }
}
