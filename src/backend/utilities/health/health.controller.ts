import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { User } from '@/common/security/permission.service';
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    @InjectConnection() private connection: Connection,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Comprehensive health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  async check() {
    return this.health.check([
      // Database health
      () => this.db.pingCheck('database'),

      // Memory health (heap < 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Memory health (RSS < 500MB)
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // Redis health
      async () => {
        try {
          // Try to set and get a test value
          await this.cacheManager.set('health:check', 'ok', 1000);
          const value = await this.cacheManager.get('health:check');
          await this.cacheManager.del('health:check');

          return {
            redis: {
              status: value === 'ok' ? 'up' : 'down',
            },
          };
        } catch (error) {
          return {
            redis: {
              status: 'down',
              message: error.message,
            },
          };
        }
      },
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - checks if service can accept traffic' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    // Check if database connection is established
    if (!this.connection.isInitialized) {
      return {
        status: 'not ready',
        reason: 'Database not initialized',
      };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe - checks if service is alive' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'smarterp-monolith',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };
  }
}
