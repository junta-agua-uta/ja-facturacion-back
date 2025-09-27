-- DropForeignKey
ALTER TABLE `abonos` DROP FOREIGN KEY `ABONOS_ID_CUENTA_fkey`;

-- DropForeignKey
ALTER TABLE `cuentas` DROP FOREIGN KEY `CUENTAS_ID_CLIENTE_fkey`;

-- DropForeignKey
ALTER TABLE `detalles_factura` DROP FOREIGN KEY `DETALLES_FACTURA_ID_FACTURA_fkey`;

-- DropForeignKey
ALTER TABLE `detalles_factura` DROP FOREIGN KEY `DETALLES_FACTURA_ID_RAZON_fkey`;

-- DropForeignKey
ALTER TABLE `detalles_medidor` DROP FOREIGN KEY `DETALLES_MEDIDOR_ID_MEDIDOR_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `FACTURAS_ID_CLIENTE_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `FACTURAS_ID_MEDIDOR_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `FACTURAS_ID_SUCURSAL_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `FACTURAS_ID_USUARIO_fkey`;

-- DropForeignKey
ALTER TABLE `medidores` DROP FOREIGN KEY `MEDIDORES_ID_CLIENTE_fkey`;

-- CreateTable
CREATE TABLE `conceptos` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `CODIGO` VARCHAR(32) NOT NULL,
    `COD_INTERNO` VARCHAR(32) NULL,
    `DESCRIPCION` VARCHAR(255) NOT NULL,
    `PRECIO_BASE` DECIMAL(10, 2) NULL,
    `REQUIERE_MES` BOOLEAN NOT NULL DEFAULT false,
    `ESTADO` BOOLEAN NOT NULL DEFAULT true,
    `FECHA_CREACION` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `CODIGO`(`CODIGO`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liquidacion_compra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaEmision` VARCHAR(191) NOT NULL,
    `dirEstablecimiento` VARCHAR(191) NOT NULL,
    `tipoIdentificacionProveedor` VARCHAR(191) NOT NULL,
    `razonSocialProveedor` VARCHAR(191) NOT NULL,
    `identificacionProveedor` VARCHAR(191) NOT NULL,
    `totalSinImpuestos` DOUBLE NOT NULL,
    `totalDescuento` DOUBLE NOT NULL,
    `importeTotal` DOUBLE NOT NULL,
    `moneda` VARCHAR(191) NOT NULL,
    `xml` LONGTEXT NULL,
    `accessKey` VARCHAR(191) NULL,
    `estadoSri` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalle_liquidacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigoPrincipal` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `precioUnitario` DOUBLE NOT NULL,
    `cantidad` DOUBLE NOT NULL,
    `descuento` DOUBLE NOT NULL,
    `precioTotalSinImpuesto` DOUBLE NOT NULL,
    `codigoImpuesto` VARCHAR(191) NOT NULL,
    `codigoPorcentajeImpuesto` VARCHAR(191) NOT NULL,
    `tarifaImpuesto` DOUBLE NOT NULL,
    `baseImponible` DOUBLE NOT NULL,
    `valorImpuesto` DOUBLE NOT NULL,
    `liquidacionId` INTEGER NOT NULL,

    INDEX `detalle_liquidacion_liquidacionId_idx`(`liquidacionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cuentas` ADD CONSTRAINT `cuentas_ID_CLIENTE_fkey` FOREIGN KEY (`ID_CLIENTE`) REFERENCES `clientes`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abonos` ADD CONSTRAINT `abonos_ID_CUENTA_fkey` FOREIGN KEY (`ID_CUENTA`) REFERENCES `cuentas`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidores` ADD CONSTRAINT `medidores_ID_CLIENTE_fkey` FOREIGN KEY (`ID_CLIENTE`) REFERENCES `clientes`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_medidor` ADD CONSTRAINT `detalles_medidor_ID_MEDIDOR_fkey` FOREIGN KEY (`ID_MEDIDOR`) REFERENCES `medidores`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_CLIENTE_fkey` FOREIGN KEY (`ID_CLIENTE`) REFERENCES `clientes`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_MEDIDOR_fkey` FOREIGN KEY (`ID_MEDIDOR`) REFERENCES `medidores`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_SUCURSAL_fkey` FOREIGN KEY (`ID_SUCURSAL`) REFERENCES `sucursales`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_USUARIO_fkey` FOREIGN KEY (`ID_USUARIO`) REFERENCES `usuarios`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_ID_FACTURA_fkey` FOREIGN KEY (`ID_FACTURA`) REFERENCES `facturas`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_ID_RAZON_fkey` FOREIGN KEY (`ID_RAZON`) REFERENCES `razones`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_liquidacion` ADD CONSTRAINT `detalle_liquidacion_liquidacionId_fkey` FOREIGN KEY (`liquidacionId`) REFERENCES `liquidacion_compra`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `clientes` RENAME INDEX `CLIENTES_IDENTIFICACION_key` TO `clientes_IDENTIFICACION_key`;

-- RenameIndex
ALTER TABLE `medidores` RENAME INDEX `MEDIDORES_NUMERO_MEDIDOR_key` TO `medidores_NUMERO_MEDIDOR_key`;

-- RenameIndex
ALTER TABLE `usuarios` RENAME INDEX `USUARIOS_CEDULA_key` TO `usuarios_CEDULA_key`;

-- RenameIndex
ALTER TABLE `usuarios` RENAME INDEX `USUARIOS_CORREO_key` TO `usuarios_CORREO_key`;

