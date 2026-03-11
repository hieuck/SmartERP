import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from '@common/interceptors/correlation-id.interceptor';
import { QueryPerformanceInterceptor } from '@common/interceptors/query-performance.interceptor';
import { LoggerService } from '@common/logger/logger.service';
import { MetricsInterceptor } from '@common/metrics/metrics.interceptor';
import { MetricsService } from '@common/metrics/metrics.service';
import { ResponseTransformInterceptor } from '@common/response/field-filter.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import 'tsconfig-paths/register';
import { AppModule } from './app.module';

async function bootstrap() {
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

  logger.log('🔒 Security headers enabled (Helmet.js)');

  app.use(compression());
  logger.log('📦 Response compression enabled');

  app.useGlobalFilters(new HttpExceptionFilter());

  const metricsService = app.get(MetricsService);

  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new QueryPerformanceInterceptor(metricsService),
    new MetricsInterceptor(metricsService),
    new ResponseTransformInterceptor(),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5175',
    credentials: true,
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

  logger.log(`🚀 SmartERP Monolith running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`📊 Health Check: http://localhost:${port}/api/health`);
  logger.log(`📈 Metrics: http://localhost:${port}/api/metrics`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
