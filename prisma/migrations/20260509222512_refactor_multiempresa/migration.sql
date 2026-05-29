/*
  Warnings:

  - You are about to drop the column `empresaId` on the `usuarios` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `usuarios` DROP FOREIGN KEY `usuarios_empresaId_fkey`;

-- DropIndex
DROP INDEX `usuarios_empresaId_fkey` ON `usuarios`;

-- AlterTable
ALTER TABLE `empresas` ADD COLUMN `modoAsientos` VARCHAR(191) NOT NULL DEFAULT 'INDIVIDUAL';

-- AlterTable
ALTER TABLE `usuarios` DROP COLUMN `empresaId`;

-- CreateTable
CREATE TABLE `usuario_empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `empresaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuario_empresa_usuarioId_empresaId_key`(`usuarioId`, `empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cliente_empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `empresaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cliente_empresa_clienteId_empresaId_key`(`clienteId`, `empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuario_empresa` ADD CONSTRAINT `usuario_empresa_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_empresa` ADD CONSTRAINT `usuario_empresa_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cliente_empresa` ADD CONSTRAINT `cliente_empresa_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cliente_empresa` ADD CONSTRAINT `cliente_empresa_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
