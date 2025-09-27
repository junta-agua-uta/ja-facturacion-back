# Sistema de Facturación Electrónica – NestJS

Este proyecto implementa un sistema de *facturación electrónica* con *NestJS, **Prisma ORM* y *MySQL*.  
Incluye integración con el *SRI (Ecuador)* para el envío y autorización de comprobantes electrónicos.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- [MySQL](https://dev.mysql.com/downloads/mysql/)
- [Git](https://git-scm.com/)

---

## Instalación

1. Clona el repositorio e instala las dependencias:


npm i


2. Configura un archivo .env en la raíz del proyecto.  
   Puedes guiarte del archivo .env.example que incluye todos los campos necesarios.  
   *Nota:* Consultar las credenciales reales con el administrador.

3. Generar la migración de Prisma en una base de datos vacía:


npx prisma generate


4. Crear una migración con un nombre descriptivo:


npx prisma migrate dev --name init


5. Generar el cliente Prisma actualizado:


npx prisma generate


6. Correr la aplicación en modo desarrollo:


npm run start:dev


---

## Crear tablas o hacer cambios

Para agregar nuevas tablas o modificar existentes:

1. Editar el archivo prisma/schema.prisma y definir los modelos.
2. Crear una nueva migración con un nombre descriptivo:


npx prisma migrate dev --name nombre_migracion


3. Regenerar el cliente Prisma:


npx prisma generate


4. Verifica que las tablas estén creadas correctamente en tu base de datos.