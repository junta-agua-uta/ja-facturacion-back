import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: () => void) {
    const user = req.body
    if (user && user.password) {
      const salt = await bcrypt.genSalt()
      const passwordHash = await bcrypt.hash(user.password as string, salt)
      user.hash = passwordHash
      user.salt = salt
    }
    next()
  }
}
