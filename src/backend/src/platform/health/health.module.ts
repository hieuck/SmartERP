import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Health Module
 * 
 * Provides health check endpoints for monitoring
 * Uses @nestjs/terminus for health checks
 * 
 * Day 4-7: Add Monitoring
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
