import { Global, Module } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { JwtModule } from '@nestjs/jwt'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AuditoriaService } from './services/auditoria.service'
import { AuditoriaInterceptor } from './interceptors/auditoria.interceptor'
import { AuditoriaController } from './auditoria.controller'

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuditoriaController],
  providers: [
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
    AuditoriaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
  exports: [PrismaClient, JwtModule, AuditoriaService],
})
export class CommonModule {}
