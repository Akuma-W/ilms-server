import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Create app
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Sercurity middlewares
  app.use(helmet());
  app.enableCors({
    origin: [configService.get<string>('cors.origin')],
    credentials: true,
  });
  app.use(cookieParser());

  // Custom Global
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.get<string>('appVersion'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger
  const options = new DocumentBuilder()
    .setTitle('Test')
    .setDescription('Test API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token: Bearer <token>',
      },
      'accessToken',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  // Listen port
  try {
    const port = configService.get<number>('port') || 3000;
    await app.listen(port);
    console.log(`Server is running on http://localhost:${port}/api/v1`);
    console.log(`API Document is running on http://localhost:${port}/docs`);
  } catch (error) {
    console.error('Server failed to start: ', error);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed: ', error);
});
