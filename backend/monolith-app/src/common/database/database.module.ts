import { Module, Global } from '@nestjs/common';
import { DatabaseMonitoringService } from './database-monitoring.service';
import { MetricsModule } from '../metrics/metrics.module';

/**
 * Database Module
 *
 * Provides database monitoring and optimization utilities
 */
@Global()
@Module({
  imports: [MetricsModule],
  providers: [DatabaseMonitoringService],
  exports: [DatabaseMonitoringService],
})
export class DatabaseModule {}
