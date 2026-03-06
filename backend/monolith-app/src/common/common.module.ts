import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';
import { MetricsController } from './controllers/metrics.controller';
import { QueryPerformanceInterceptor } from './interceptors/query-performance.interceptor';

/**
 * Common module providing shared services and utilities
 * Marked as @Global to make services available throughout the application
 */
@Global()
@Module({
  providers: [MetricsService, QueryPerformanceInterceptor],
  controllers: [MetricsController],
  exports: [MetricsService, QueryPerformanceInterceptor],
})
export class CommonModule {}
