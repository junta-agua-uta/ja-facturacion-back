/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaClient, USUARIOS } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { UpdateUserDto, ChangePasswordDto } from '../dtos/update-user.dto'

@Injectable()
export class UpdateUserService {
    constructor(private prisma: PrismaClient) { }
    /**
     * Actualizar datos del usuario (sin incluir contraseña)
     */
    async updateUser(
        userId: number,
        updateData: UpdateUserDto,
    ): Promise<Omit<USUARIOS, 'HASH' | 'SALT'>> {
        // Verificar que el usuario existe
        const existingUser = await this.prisma.uSUARIOS.findUnique({
            where: { ID: userId },
        })

        if (!existingUser) {
            throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND)
        }

        // Verificar si el nuevo correo ya está en uso por otro usuario
        if (updateData.correo && updateData.correo !== existingUser.CORREO) {
            const emailExists = await this.prisma.uSUARIOS.findFirst({
                where: {
                    CORREO: updateData.correo,
                    ID: { not: userId },
                },
            })

            if (emailExists) {
                throw new HttpException(
                    'El correo electrónico ya está registrado',
                    HttpStatus.BAD_REQUEST,
                )
            }
        }

        // Verificar si la nueva cédula ya está en uso por otro usuario
        if (updateData.cedula && updateData.cedula !== existingUser.CEDULA) {
            const cedulaExists = await this.prisma.uSUARIOS.findFirst({
                where: {
                    CEDULA: updateData.cedula,
                    ID: { not: userId },
                },
            })

            if (cedulaExists) {
                throw new HttpException(
                    'La cédula ya está registrada',
                    HttpStatus.BAD_REQUEST,
                )
            }
        }

        // Preparar datos para actualizar
        const dataToUpdate: any = {}

        if (updateData.cedula) dataToUpdate.CEDULA = updateData.cedula
        if (updateData.nombre) dataToUpdate.NOMBRE = updateData.nombre
        if (updateData.apellido) dataToUpdate.APELLIDO = updateData.apellido
        if (updateData.correo) dataToUpdate.CORREO = updateData.correo

        try {
            const updatedUser = await this.prisma.uSUARIOS.update({
                where: { ID: userId },
                data: dataToUpdate,
            })

            // Remover campos sensibles antes de retornar
            const { HASH, SALT, ...userWithoutSensitiveData } = updatedUser
            return userWithoutSensitiveData
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpException(
                    'El usuario ya existe con esos datos',
                    HttpStatus.BAD_REQUEST,
                )
            }
            throw new HttpException(
                'Error al actualizar el usuario',
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    /**
     * Cambiar contraseña del usuario
     */
    async changePassword(
        userId: number,
        changePasswordData: ChangePasswordDto,
    ): Promise<{ message: string }> {
        // Obtener usuario con sus credenciales
        const user = await this.prisma.uSUARIOS.findUniqueOrThrow({
            where: {
                ID: userId,
                NOT: {
                    ESTADO: false
                }
            },
        })
            .catch(() => {
                return null
            })

        if (!user) {
            throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND)
        }
        // Verificar contraseña actual
        const isPasswordValid = await bcrypt.compare(changePasswordData.currentPassword, user.HASH)

        if (!isPasswordValid) {
            throw new HttpException(
                'Contraseña actual incorrecta',
                HttpStatus.UNAUTHORIZED,
            )
        }

        // Generar nuevo hash y salt para la nueva contraseña
        try {
            const result = await this.prisma.uSUARIOS.update({
                where: { ID: userId },
                data: {
                    HASH: changePasswordData.hash,
                    SALT: changePasswordData.salt,
                },
            })
            return { message: 'Contraseña actualizada exitosamente' }
        } catch (error) {
            throw new HttpException(
                'Error al cambiar la contraseña',
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }


}