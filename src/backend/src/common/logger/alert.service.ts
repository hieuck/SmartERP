import { Injectable, Logger } from '@nestjs/common';

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface Alert {
  level: AlertLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Alert Service
 *
 * Basic alerting mechanism for monitoring:
 * - Log-based alerts (can be extended to external services)
 * - Alert levels: INFO, WARNING, ERROR, CRITICAL
 * - Metadata support for context
 *
 * Future enhancements:
 * - Email notifications
 * - Slack/Discord webhooks
 * - PagerDuty integration
 * - Alert aggregation and deduplication
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger('AlertService');

  /**
   * Send an alert
   */
  async sendAlert(alert: Alert): Promise<void> {
    const logMessage = {
      type: 'alert',
      level: alert.level,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      metadata: alert.metadata,
    };

    switch (alert.level) {
      case AlertLevel.CRITICAL:
      case AlertLevel.ERROR:
        this.logger.error(logMessage);
        // TODO: Send to external alerting service (PagerDuty, email, etc.)
        break;

      case AlertLevel.WARNING:
        this.logger.warn(logMessage);
        break;

      case AlertLevel.INFO:
      default:
        this.logger.log(logMessage);
        break;
    }
  }

  /**
   * Alert for high memory usage
   */
  async alertHighMemory(heapUsedMB: number, threshold: number): Promise<void> {
    await this.sendAlert({
      level: AlertLevel.WARNING,
      message: `High memory usage detected: ${heapUsedMB}MB (threshold: ${threshold}MB)`,
      timestamp: new Date(),
      metadata: {
        heapUsedMB,
        threshold,
        memoryUsage: process.memoryUsage(),
      },
    });
  }

  /**
   * Alert for slow API response
   */
  async alertSlowResponse(url: string, duration: number, threshold: number): Promise<void> {
    await this.sendAlert({
      level: AlertLevel.WARNING,
      message: `Slow API response detected: ${url} took ${duration}ms (threshold: ${threshold}ms)`,
      timestamp: new Date(),
      metadata: {
        url,
        duration,
        threshold,
      },
    });
  }

  /**
   * Alert for database connection issues
   */
  async alertDatabaseError(error: Error): Promise<void> {
    await this.sendAlert({
      level: AlertLevel.CRITICAL,
      message: `Database connection error: ${error.message}`,
      timestamp: new Date(),
      metadata: {
        error: error.message,
        stack: error.stack,
      },
    });
  }

  /**
   * Alert for cache connection issues
   */
  async alertCacheError(error: Error): Promise<void> {
    await this.sendAlert({
      level: AlertLevel.ERROR,
      message: `Cache connection error: ${error.message}`,
      timestamp: new Date(),
      metadata: {
        error: error.message,
        stack: error.stack,
      },
    });
  }

  /**
   * Alert for high error rate
   */
  async alertHighErrorRate(
    errorCount: number,
    totalRequests: number,
    threshold: number,
  ): Promise<void> {
    const errorRate = (errorCount / totalRequests) * 100;

    await this.sendAlert({
      level: AlertLevel.ERROR,
      message: `High error rate detected: ${errorRate.toFixed(2)}% (threshold: ${threshold}%)`,
      timestamp: new Date(),
      metadata: {
        errorCount,
        totalRequests,
        errorRate,
        threshold,
      },
    });
  }
}
