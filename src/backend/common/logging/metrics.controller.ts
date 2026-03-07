import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../core/auth/decorators/public.decorator';

import { User } from '@/common/security/permission.service';
/**
 * Metrics Controller
 *
 * Provides application metrics for monitoring:
 * - /metrics - Prometheus-compatible metrics
 * - /metrics/app - Application-specific metrics
 */
@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get Prometheus-compatible metrics' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Prometheus format
    return `
# HELP nodejs_memory_heap_used_bytes Memory heap used in bytes
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${memoryUsage.heapUsed}

# HELP nodejs_memory_heap_total_bytes Memory heap total in bytes
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${memoryUsage.heapTotal}

# HELP nodejs_memory_rss_bytes Memory RSS in bytes
# TYPE nodejs_memory_rss_bytes gauge
nodejs_memory_rss_bytes ${memoryUsage.rss}

# HELP nodejs_memory_external_bytes Memory external in bytes
# TYPE nodejs_memory_external_bytes gauge
nodejs_memory_external_bytes ${memoryUsage.external}

# HELP nodejs_cpu_user_microseconds CPU user time in microseconds
# TYPE nodejs_cpu_user_microseconds counter
nodejs_cpu_user_microseconds ${cpuUsage.user}

# HELP nodejs_cpu_system_microseconds CPU system time in microseconds
# TYPE nodejs_cpu_system_microseconds counter
nodejs_cpu_system_microseconds ${cpuUsage.system}

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds ${process.uptime()}
    `.trim();
  }

  @Get('app')
  @Public()
  @ApiOperation({ summary: 'Get application-specific metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics in JSON format' })
  getAppMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      service: 'smarterp-monolith',
      version: '1.0.0',
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: this.formatUptime(process.uptime()),
      },
      memory: {
        heapUsed: {
          bytes: memoryUsage.heapUsed,
          mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
        heapTotal: {
          bytes: memoryUsage.heapTotal,
          mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        rss: {
          bytes: memoryUsage.rss,
          mb: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        external: {
          bytes: memoryUsage.external,
          mb: Math.round(memoryUsage.external / 1024 / 1024),
        },
      },
      cpu: {
        user: {
          microseconds: cpuUsage.user,
          seconds: Math.round(cpuUsage.user / 1000000),
        },
        system: {
          microseconds: cpuUsage.system,
          seconds: Math.round(cpuUsage.system / 1000000),
        },
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
