-- DropForeignKey
ALTER TABLE `abonos` DROP FOREIGN KEY `abonos_ID_CUENTA_fkey`;

-- DropForeignKey
ALTER TABLE `cuentas` DROP FOREIGN KEY `cuentas_ID_CLIENTE_fkey`;

-- DropForeignKey
ALTER TABLE `detalle_liquidacion` DROP FOREIGN KEY `detalle_liquidacion_liquidacionId_fkey`;

-- DropForeignKey
ALTER TABLE `detalles_factura` DROP FOREIGN KEY `detalles_factura_ID_FACTURA_fkey`;

-- DropForeignKey
ALTER TABLE `detalles_factura` DROP FOREIGN KEY `detalles_factura_ID_RAZON_fkey`;

-- DropForeignKey
ALTER TABLE `detalles_medidor` DROP FOREIGN KEY `detalles_medidor_ID_MEDIDOR_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `facturas_ID_CLIENTE_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `facturas_ID_MEDIDOR_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `facturas_ID_SUCURSAL_fkey`;

-- DropForeignKey
ALTER TABLE `facturas` DROP FOREIGN KEY `facturas_ID_USUARIO_fkey`;

-- DropForeignKey
ALTER TABLE `medidores` DROP FOREIGN KEY `medidores_ID_CLIENTE_fkey`;

-- AlterTable
ALTER TABLE `abonos` ADD COLUMN `asientoId` INTEGER NULL;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `empresas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `ruc` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `representanteLegal` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `empresas_ruc_key`(`ruc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodos_contables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NOT NULL,
    `estado` ENUM('ABIERTO', 'CERRADO') NOT NULL DEFAULT 'ABIERTO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` INTEGER NOT NULL,

    UNIQUE INDEX `periodos_contables_empresaId_nombre_key`(`empresaId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_cuentas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `naturaleza` VARCHAR(191) NOT NULL,
    `casillero` VARCHAR(191) NULL,
    `nivel` INTEGER NOT NULL,
    `esDetalle` BOOLEAN NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` INTEGER NOT NULL,
    `padreId` INTEGER NULL,

    UNIQUE INDEX `plan_cuentas_empresaId_codigo_key`(`empresaId`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asientos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comprobante` VARCHAR(191) NULL,
    `modelo` VARCHAR(191) NULL,
    `diarios` VARCHAR(191) NULL,
    `codigo` VARCHAR(191) NULL,
    `numero` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `estado` ENUM('PENDIENTE', 'APROBADO') NOT NULL DEFAULT 'PENDIENTE',
    `formato` VARCHAR(191) NULL,
    `descuadre` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `fechaAprobacion` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `periodoId` INTEGER NOT NULL,
    `creadoPorId` INTEGER NOT NULL,
    `aprobadoPorId` INTEGER NULL,

    UNIQUE INDEX `asientos_periodoId_numero_key`(`periodoId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_asiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no` INTEGER NOT NULL,
    `codcta` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `referencia` VARCHAR(191) NULL,
    `descta` VARCHAR(191) NULL,
    `debe` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `haber` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `asientoId` INTEGER NOT NULL,
    `cuentaId` INTEGER NOT NULL,

    UNIQUE INDEX `detalles_asiento_asientoId_no_key`(`asientoId`, `no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas_asiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoRelacion` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `facturaId` INTEGER NOT NULL,
    `asientoId` INTEGER NOT NULL,

    UNIQUE INDEX `facturas_asiento_facturaId_asientoId_key`(`facturaId`, `asientoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config_asientos_auto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoTransaccion` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` INTEGER NOT NULL,
    `cuentaDebeId` INTEGER NOT NULL,
    `cuentaHaberId` INTEGER NOT NULL,
    `cuentaIvaId` INTEGER NULL,

    UNIQUE INDEX `config_asientos_auto_empresaId_tipoTransaccion_key`(`empresaId`, `tipoTransaccion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accion` VARCHAR(191) NOT NULL,
    `entidad` VARCHAR(191) NOT NULL,
    `entidadId` INTEGER NOT NULL,
    `datosPrevios` JSON NULL,
    `datosNuevos` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


INSERT INTO `empresas` (`id`, `nombre`, `email`, `ruc`, `direccion`, `telefono`, `representanteLegal`, `updatedAt`) 
VALUES (1, 'Junta de Agua Principal', 'info@junta.com', '9999999999999', 'Dirección Principal', '0999999999', 'Administrador', CURRENT_TIMESTAMP(3));

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuentas` ADD CONSTRAINT `cuentas_ID_CLIENTE_fkey` FOREIGN KEY (`ID_CLIENTE`) REFERENCES `clientes`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abonos` ADD CONSTRAINT `abonos_ID_CUENTA_fkey` FOREIGN KEY (`ID_CUENTA`) REFERENCES `cuentas`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abonos` ADD CONSTRAINT `abonos_asientoId_fkey` FOREIGN KEY (`asientoId`) REFERENCES `asientos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidores` ADD CONSTRAINT `medidores_ID_CLIENTE_fkey` FOREIGN KEY (`ID_CLIENTE`) REFERENCES `clientes`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_medidor` ADD CONSTRAINT `detalles_medidor_ID_MEDIDOR_fkey` FOREIGN KEY (`ID_MEDIDOR`) REFERENCES `medidores`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_CLIENTE_fkey` FOREIGN KEY (`ID_CLIENTE`) REFERENCES `clientes`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_MEDIDOR_fkey` FOREIGN KEY (`ID_MEDIDOR`) REFERENCES `medidores`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_SUCURSAL_fkey` FOREIGN KEY (`ID_SUCURSAL`) REFERENCES `sucursales`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ID_USUARIO_fkey` FOREIGN KEY (`ID_USUARIO`) REFERENCES `usuarios`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_ID_FACTURA_fkey` FOREIGN KEY (`ID_FACTURA`) REFERENCES `facturas`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_ID_RAZON_fkey` FOREIGN KEY (`ID_RAZON`) REFERENCES `razones`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_liquidacion` ADD CONSTRAINT `detalle_liquidacion_liquidacionId_fkey` FOREIGN KEY (`liquidacionId`) REFERENCES `liquidacion_compra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodos_contables` ADD CONSTRAINT `periodos_contables_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_cuentas` ADD CONSTRAINT `plan_cuentas_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_cuentas` ADD CONSTRAINT `plan_cuentas_padreId_fkey` FOREIGN KEY (`padreId`) REFERENCES `plan_cuentas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asientos` ADD CONSTRAINT `asientos_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `periodos_contables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asientos` ADD CONSTRAINT `asientos_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asientos` ADD CONSTRAINT `asientos_aprobadoPorId_fkey` FOREIGN KEY (`aprobadoPorId`) REFERENCES `usuarios`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_asiento` ADD CONSTRAINT `detalles_asiento_asientoId_fkey` FOREIGN KEY (`asientoId`) REFERENCES `asientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_asiento` ADD CONSTRAINT `detalles_asiento_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `plan_cuentas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas_asiento` ADD CONSTRAINT `facturas_asiento_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `facturas`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas_asiento` ADD CONSTRAINT `facturas_asiento_asientoId_fkey` FOREIGN KEY (`asientoId`) REFERENCES `asientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `config_asientos_auto` ADD CONSTRAINT `config_asientos_auto_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `config_asientos_auto` ADD CONSTRAINT `config_asientos_auto_cuentaDebeId_fkey` FOREIGN KEY (`cuentaDebeId`) REFERENCES `plan_cuentas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `config_asientos_auto` ADD CONSTRAINT `config_asientos_auto_cuentaHaberId_fkey` FOREIGN KEY (`cuentaHaberId`) REFERENCES `plan_cuentas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `config_asientos_auto` ADD CONSTRAINT `config_asientos_auto_cuentaIvaId_fkey` FOREIGN KEY (`cuentaIvaId`) REFERENCES `plan_cuentas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria_logs` ADD CONSTRAINT `auditoria_logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;
