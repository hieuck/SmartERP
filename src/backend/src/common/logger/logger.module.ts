import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './logging.interceptor';
import { MetricsController } from './metrics.controller';
import { AlertService } from './alert.service';
import { LoggerService } from './logger.service';

/**
 * Logger Module
 *
 * Provides:
 * - Structured logging via interceptor
 * - Metrics endpoints (Prometheus + JSON)
 * - Alert service for monitoring
 * - Global logging for all requests
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    LoggerService,
    AlertService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [LoggerService, AlertService],
})
export class LoggerModule {}
