import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Health Check Controller
 *
 * Provides health check endpoints for monitoring
 * - /health: Overall health status
 * - /health/db: Database health
 * - /health/memory: Memory usage
 * - /health/disk: Disk usage
 *
 * Day 4-7: Add Monitoring
 */
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * Overall health check
   * GET /health
   */
  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health
      () => this.db.pingCheck('database'),

      // Memory health (heap should not exceed 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Memory health (RSS should not exceed 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Disk health (storage should have at least 50% free)
      () =>
        this.disk.checkStorage('storage', {
          path: process.cwd(),
          thresholdPercent: 0.5,
        }),
    ]);
  }

  /**
   * Database health check
   * GET /health/db
   */
  @Get('db')
  @Public()
  @HealthCheck()
  checkDatabase() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  /**
   * Memory health check
   * GET /health/memory
   */
  @Get('memory')
  @Public()
  @HealthCheck()
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  /**
   * Disk health check
   * GET /health/disk
   */
  @Get('disk')
  @Public()
  @HealthCheck()
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: process.cwd(),
          thresholdPercent: 0.5,
        }),
    ]);
  }

  /**
   * Liveness probe (for Kubernetes)
   * GET /health/live
   */
  @Get('live')
  @Public()
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe (for Kubernetes)
   * GET /health/ready
   */
  @Get('ready')
  @Public()
  @HealthCheck()
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
