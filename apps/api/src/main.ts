import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import multipart from '@fastify/multipart';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      requestTimeout: 30_000,
      connectionTimeout: 10_000,
    }),
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 4000;
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api';
  const corsOrigins = config.get<string>('app.corsOrigins') ?? 'http://localhost:3000';
  const isProd = process.env['NODE_ENV'] === 'production';

  // Register multipart for file uploads
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // Security headers via Fastify hook (replaces helmet for Fastify)
  app.getHttpAdapter().getInstance().addHook('onSend', (_req: unknown, reply: { header: (k: string, v: string) => void }, _payload: unknown, done: () => void) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProd) reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    done();
  });

  // Request logging
  app.getHttpAdapter().getInstance().addHook('onRequest', (req: { method: string; url: string }, _reply: unknown, done: () => void) => {
    if (!req.url.includes('/health')) {
      logger.log(`${req.method} ${req.url}`);
    }
    done();
  });

  // Global prefix + versioning
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // CORS
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger (dev only)
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('UNKORA API')
      .setDescription('UNKORA Commerce Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received — shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`UNKORA API running on http://localhost:${port}/${apiPrefix}/v1`);
  if (!isProd) logger.log(`Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
}

void bootstrap();
