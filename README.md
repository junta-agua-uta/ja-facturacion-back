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

## Configuración de GitHub Packages
Este proyecto utiliza paquetes alojados en GitHub Packages. Es necesario autenticarse para poder instalar las dependencias.
1. Inicia sesión en GitHub.

2. Ve a: https://github.com/settings/tokens/new

3. Configura el token:
   - **Note:** `Acceso a paquetes junta-agua-uta`
   - **Expiration:** Configura según tus necesidades
   - **Permisos:** Marca `read:packages`

4. Haz clic en **Generate token** al final de la página y cópialo.

5. Ejecuta el siguiente comando en tu terminal:
   ```bash
   npm login --scope=@junta-agua-uta --auth-type=legacy --registry=https://npm.pkg.github.com
   ```

6. Ingresa la información solicitada:
   - **Username:** Tu usuario de GitHub
   - **Password:** El token que copiaste en el paso 4
   - **Email:** Tu email público de GitHub

7. Verifica que la autenticación fue exitosa. Deberías ver:
   ```
   Logged in to scope @junta-agua-uta on https://npm.pkg.github.com/
   ```

8. Instala las dependencias normalmente:
   ```bash
   npm install
   ```

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

---

## 🚨 Atención: Especial Módulo Contable (Abril 2026)

Si **recién haces pull** de los modelos del Módulo Contable (tablas como `empresas`, `asientos`, etc.), y tu base de datos **ya tenía usuarios previos**, Prisma fallará aplicando el `empresaId`. Sigue este flujo estricto para evitar errores:

1. Crea la migración vacía sin aplicarla:
   ```bash
   npx prisma migrate dev --name init_modulo_contable --create-only
   ```
2. Ve al archivo `prisma/migrations/xxxx_init_modulo_contable/migration.sql` que se acaba de crear y agrega **antes** del `ALTER TABLE usuarios` el siguiente insert manual para la base de la foreign key:
   ```sql
   INSERT INTO `empresas` (`id`, `nombre`, `email`, `ruc`, `direccion`, `telefono`, `representanteLegal`, `updatedAt`) 
   VALUES (1, 'Junta de Agua Principal', 'info@junta.com', '9999999999999', 'Dirección Principal', '0999999999', 'Administrador', CURRENT_TIMESTAMP(3));
   ```
3. Ahora sí, aplica la migración en tu entorno local:
   ```bash
   npx prisma migrate dev
   ```
