import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import {
  ClassSerializerInterceptor,
  ConsoleLogger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Create app
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      logLevels: ['log', 'debug', 'error', 'warn'],
      prefix: 'MyApp',
      timestamp: true,
    }),
  });
  const configService = app.get(ConfigService);

  // Sercurity middlewares
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('cors.origin'),
  });
  app.use(cookieParser());

  // Custom Global
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
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
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  // Listen port
  try {
    const port = configService.get<number>('port') || 3000;
    await app.listen(port);
    console.log(`Server is running on http://localhost:${port}/api`);
  } catch (error) {
    console.error('Server failed to start: ', error);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed: ', error);
});
