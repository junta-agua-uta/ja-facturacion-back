import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('apiV2')
  app.useGlobalPipes(new ValidationPipe())

  app.enableCors({
    origin: [
      'https://p01--dev-ja-facturacion-front--hcqk4hv77kmd.code.run',
      'http://localhost:5173',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  })

  const port = process.env.PORT || 4000
  const config = new DocumentBuilder()
    .setTitle('JUNT AGUA API REST')
    .setDescription(
      'API REST para la gestión de JUNTA AGUA, un sistema de gestión de agua potable y saneamiento.',
    )
    .setVersion('1.0')

    .addServer(`http://localhost:${port}`, 'Servidor local')
    .addServer('https://juntaagua.onrender.com', 'Servidor de producción')
    .addServer('https://juntaagua-sjro.onrender.com', 'Servidor de producción')

    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT cabecera de autorización Bearer',
        in: 'header',
      },
      'access-token',
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('apiV2/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none', // 'list', 'full', 'none'
      operationsSorter: 'method', // 'alpha', 'method'
      tagsSorter: 'alpha',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      filter: true,
      syntaxHighlight: {
        activate: true,
        theme: 'obsidian', // 'agate', 'obsidian', 'tomorrow', 'solarized-light', 'solarized-dark'
      },
    },
    customSiteTitle: 'JUNT AGUA API REST',
    // customfavIcon: 'https://nestjs.com/favicon.ico',
    customCss: `
      .swagger-ui .information-container { padding: 20px 0 }
      .swagger-ui .scheme-container { padding: 15px 0 }
    `,
  })

  await app.listen(port)
  Logger.log('Server is running on https://juntaagua.onrender.com:${port}')
  Logger.log('Swagger is running on https://juntaagua.onrender.com/apiV2/docs')
  Logger.log('API is running on https://juntaagua.onrender.com/apiV2')
  Logger.log(`Swagger is running on http://localhost:${port}`)
}
void bootstrap()
