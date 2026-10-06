import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 5000;
  const appPrefix = configService.get<string>('appPrefix') || 'api/v1';
  const frontendUrl = configService.get<string>('cors.frontendUrl') || 'http://localhost:3000';
  const adminUrl = configService.get<string>('cors.adminUrl') || 'http://localhost:3001';

  // Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  // Cookie Parser Middleware
  app.use(cookieParser());

  // Cross-Origin Resource Sharing (CORS)
  const allowedOrigins = Array.from(
    new Set(
      [
        frontendUrl,
        frontendUrl.replace(/\/+$/, ''),
        adminUrl,
        adminUrl.replace(/\/+$/, ''),
        'http://localhost:3000',
        'http://localhost:3001',
        'https://casa-real-estate-mocha.vercel.app',
        'https://casa-real-estate-ocih.vercel.app',
      ].filter(Boolean),
    ),
  );

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);
      if (
        allowedOrigins.includes(requestOrigin) ||
        requestOrigin.endsWith('.vercel.app') ||
        requestOrigin.includes('localhost')
      ) {
        return callback(null, true);
      }
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-razorpay-signature'],
  });

  // Global Exception Handling & Interceptors
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global API Prefix with /health exclusion for root and versioned healthchecks
  app.setGlobalPrefix(appPrefix, {
    exclude: ['health', 'api/v1/health'],
  });

  // OpenAPI Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CASA Real Estate API')
    .setDescription('Modular RESTful Microservices Gateway for CASA Marketplace')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Health', 'System health checks and status')
    .addTag('Properties', 'Property advertisements and discovery')
    .addTag('Auth', 'Mobile OTP verification & session management')
    .addTag('Admin Governance', 'Administrative moderation and operations')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful Shutdown Hooks
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 CASA API Gateway running on: http://localhost:${port}/${appPrefix}`);
  logger.log(`🩺 Health Check endpoint available at: http://localhost:${port}/health`);
  logger.log(`📚 OpenAPI Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
