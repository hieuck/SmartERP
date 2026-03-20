import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from '@common/interceptors/correlation-id.interceptor';
import { QueryPerformanceInterceptor } from '@common/interceptors/query-performance.interceptor';
import { LoggerService } from '@common/logger/logger.service';
import { MetricsInterceptor } from '@common/metrics/metrics.interceptor';
import { MetricsService } from '@common/metrics/metrics.service';
import { ResponseTransformInterceptor } from '@common/response/field-filter.interceptor';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import 'tsconfig-paths/register';
import { AppModule } from './app.module';
import { initSentry } from './config/sentry.config';

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const logger = app.get(LoggerService);
  logger.setContext('Main');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      xssFilter: true,
    }),
  );
  logger.log('Security headers enabled (Helmet)');

  app.use(cookieParser());
  logger.log('Cookie parser enabled');

  app.use(compression());
  logger.log('Response compression enabled');

  app.useGlobalFilters(new HttpExceptionFilter());

  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new QueryPerformanceInterceptor(metricsService),
    new MetricsInterceptor(metricsService),
    new ResponseTransformInterceptor(),
  );

  const corsOriginEnv = process.env.CORS_ORIGIN || '';
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...corsOriginEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.')
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('SmartERP API')
    .setDescription('Monolithic ERP System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management')
    .addTag('inventory', 'Inventory management')
    .addTag('orders', 'Order management')
    .addTag('customers', 'Customer management')
    .addTag('suppliers', 'Supplier management')
    .addTag('payments', 'Payment management')
    .addTag('users', 'User management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`SmartERP Monolith running on http://localhost:${port}`);
  logger.log(`API documentation available at http://localhost:${port}/api/docs`);
  logger.log(`Health check available at http://localhost:${port}/api/health`);
  logger.log(`Metrics available at http://localhost:${port}/api/metrics`);

  if (process.env.NODE_ENV !== 'production') {
    try {
      const { SeedService } = await import('./utilities/seed/seed.service');
      const seedService = app.get(SeedService);
      const result = await seedService.seedDemoData();

      logger.log(`Demo data seed result: ${result.message}`);
      logger.log(`Demo credentials: ${result.credentials.email} / ${result.credentials.password}`);
    } catch {
      logger.warn('Demo data seeding skipped or already applied.');
    }
  }
}

bootstrap().catch((error) => {
  const fallbackLogger = new Logger('Bootstrap');
  fallbackLogger.error('Failed to start application', error.stack || error);
  process.exit(1);
});
