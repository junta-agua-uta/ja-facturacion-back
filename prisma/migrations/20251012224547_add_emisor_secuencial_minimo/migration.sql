/*
  Warnings:

  - A unique constraint covering the columns `[accessKey]` on the table `liquidacion_compra` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `emisorId` to the `liquidacion_compra` table without a default value. This is not possible if the table is not empty.
*/

-- AlterTable
ALTER TABLE `liquidacion_compra`
  ADD COLUMN `emailProveedor` VARCHAR(191) NULL,
  ADD COLUMN `emisorId` INTEGER NOT NULL,
  ADD COLUMN `estab` VARCHAR(3) NOT NULL DEFAULT '001',
  ADD COLUMN `ptoEmi` VARCHAR(3) NOT NULL DEFAULT '300',
  ADD COLUMN `secuencial` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `emisor` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `ruc` VARCHAR(191) NOT NULL,
  `razonSocial` VARCHAR(191) NOT NULL,
  `nombreComercial` VARCHAR(191) NULL,
  `dirMatriz` VARCHAR(191) NOT NULL,
  `estab` VARCHAR(3) NOT NULL,
  `ptoEmi` VARCHAR(3) NOT NULL,
  `obligadoContabilidad` VARCHAR(191) NOT NULL DEFAULT 'SI',
  `contribuyenteEspecial` VARCHAR(191) NULL,
  `ambiente` VARCHAR(191) NOT NULL DEFAULT '1',
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `emisor_ruc_key`(`ruc`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `secuencial_doc` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `codDoc` VARCHAR(2) NOT NULL,
  `estab` VARCHAR(3) NOT NULL,
  `ptoEmi` VARCHAR(3) NOT NULL,
  `lastSeq` INTEGER NOT NULL DEFAULT 0,
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `secuencial_doc_codDoc_estab_ptoEmi_key`(`codDoc`, `estab`, `ptoEmi`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `liquidacion_compra_accessKey_key` ON `liquidacion_compra`(`accessKey`);

-- AddForeignKey
ALTER TABLE `liquidacion_compra`
  ADD CONSTRAINT `liquidacion_compra_emisorId_fkey`
  FOREIGN KEY (`emisorId`) REFERENCES `emisor`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

/* 
  Notas:
  - Se eliminaron los bloques de "RedefineIndex" que recreaban índices ya existentes:
    (clientes_IDENTIFICACION_key, medidores_NUMERO_MEDIDOR_key, usuarios_CEDULA_key, usuarios_CORREO_key)
    Esos eran los que causaban: "Duplicate key name 'clientes_IDENTIFICACION_key'".
  - Este script asume un reset limpio (BD vacía). Si tu tabla `liquidacion_compra` tuviera datos,
    deberías primero agregar `emisorId` como NULL, hacer backfill y luego volverlo NOT NULL.
*/
