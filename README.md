# Sistema de Facturación Electrónica – NestJS

Este proyecto implementa un sistema de **facturación electrónica** con **NestJS**, **Prisma ORM** y **MySQL**.  
Incluye integración con el **SRI (Ecuador)** para el envío y autorización de comprobantes electrónicos.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- [MySQL](https://dev.mysql.com/downloads/mysql/)
- [Git](https://git-scm.com/)

---

## Instalación

1. **Clona el repositorio e instala las dependencias:**
   ```bash
   npm ci
   ```

2. **Configura un archivo `.env` en la raíz del proyecto.**  
   Puedes guiarte en `.env.example`.  
   *Nota:* consulta las credenciales reales con el administrador.

3. **Genera el cliente de Prisma:**
   ```bash
   npx prisma generate
   ```

4. **Si la base de datos ya está creada (integración o producción) aplica las migraciones pendientes:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Corre la aplicación en modo desarrollo:**
   ```bash
   npm run start:dev
   ```

---

## Crear tablas o hacer cambios

Cuando necesites **nuevos modelos** o modificaciones en el esquema:

1. Edita `prisma/schema.prisma`.
2. Crea una migración con un nombre descriptivo:
   ```bash
   npx prisma migrate dev --name nombre_migracion
   ```
3. Regenera el cliente Prisma:
   ```bash
   npx prisma generate
   ```
4. Sube los cambios (incluyendo la carpeta `prisma/migrations`) para que otros puedan simplemente ejecutar:
   ```bash
   npx prisma migrate deploy
   ```

---

## Resumen rápido

- **Desarrollo local con base de datos vacía:**  
  ```bash
  npx prisma migrate dev --name init
  ```

- **Entorno de integración o producción con base de datos existente:**  
  ```bash
  npx prisma migrate deploy
  ```

Con esto cualquier persona que clone el proyecto y apunte a una base de datos existente solo necesita ejecutar:
```bash
npm ci && npx prisma generate && npx prisma migrate deploy
```
