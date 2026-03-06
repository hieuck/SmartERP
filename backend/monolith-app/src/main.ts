import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { QueryPerformanceInterceptor } from './common/interceptors/query-performance.interceptor';
import { MetricsService } from './common/metrics/metrics.service';
import { MetricsInterceptor } from './common/metrics/metrics.interceptor';

async function bootstrap() {
  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, use our custom one
  });

  // Get logger instance
  const logger = app.get(LoggerService);
  logger.setContext('Main');

  // Security: Apply Helmet.js for security headers
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
        maxAge: 31536000, // 1 year
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

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Get MetricsService from DI container
  const metricsService = app.get(MetricsService);

  // Apply global interceptors
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new QueryPerformanceInterceptor(metricsService),
    new MetricsInterceptor(metricsService),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Plaster ERP API')
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

  logger.log(`🚀 Plaster ERP Monolith running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`📊 Health Check: http://localhost:${port}/api/health`);
  logger.log(`📈 Metrics: http://localhost:${port}/api/metrics`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
