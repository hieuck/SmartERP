import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Interceptor to measure and log query performance
 * Logs slow queries (>100ms) and tracks execution time
 * Records metrics for Prometheus monitoring
 */
@Injectable()
export class QueryPerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('QueryPerformance');
  private readonly SLOW_QUERY_THRESHOLD_MS = 100;
  private readonly SLOW_QUERY_EXCLUDED_PATHS = ['/health', '/health/'];

  constructor(private readonly metricsService: MetricsService) {}

  private shouldSkipSlowQueryLogging(url: string): boolean {
    return this.SLOW_QUERY_EXCLUDED_PATHS.some(
      (path) => url === path || url.endsWith(path) || url.includes(`${path}/`),
    );
  }

  private isExpectedRefreshMiss(url: string, statusCode: number, errorMessage: string): boolean {
    return (
      statusCode === 401 &&
      errorMessage === 'Refresh token not provided' &&
      (url === '/api/auth/refresh' || url.endsWith('/api/auth/refresh'))
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Record metrics
          this.metricsService.recordQueryDuration(method, url, statusCode, duration);

          // Log and count slow queries
          if (duration > this.SLOW_QUERY_THRESHOLD_MS && !this.shouldSkipSlowQueryLogging(url)) {
            this.metricsService.incrementSlowQuery(method, url);

            this.logger.warn(`Slow query detected: ${method} ${url} took ${duration}ms`, {
              method,
              url,
              duration,
              threshold: this.SLOW_QUERY_THRESHOLD_MS,
              statusCode,
              timestamp: new Date().toISOString(),
            });
          }

          // Log all queries in debug mode
          if (process.env.LOG_LEVEL === 'debug') {
            this.logger.debug(`${method} ${url} - ${duration}ms - ${statusCode}`);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const errorType = error.constructor.name;
          const statusCode = error instanceof HttpException ? error.getStatus() : 500;

          // Record error metrics
          this.metricsService.incrementQueryError(method, url, errorType);

          const logMessage = `Query failed: ${method} ${url} after ${duration}ms`;
          const logContext = {
            method,
            url,
            duration,
            statusCode,
            error: error.message,
            errorType,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          };

          if (statusCode >= 500) {
            this.logger.error(logMessage, logContext);
          } else if (this.isExpectedRefreshMiss(url, statusCode, logContext.error)) {
            this.logger.log(logMessage, logContext);
          } else {
            this.logger.warn(logMessage, logContext);
          }
        },
      }),
    );
  }
}
