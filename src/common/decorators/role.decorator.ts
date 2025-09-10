import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'ROL'
export const Rol = (...args: string[]) => SetMetadata(ROLES_KEY, args)
