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

/**
 * Logging Interceptor
 *
 * Logs all HTTP requests with structured format:
 * - Request: method, url, user, tenant
 * - Response: status, duration
 * - Errors: stack trace
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const now = Date.now();

    // Extract tenant and user info
    const tenantId = user?.tenantId || 'anonymous';
    const userId = user?.id || 'anonymous';
    const userEmail = user?.email || 'anonymous';

    // Log request
    this.logger.log({
      type: 'request',
      method,
      url,
      tenantId,
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - now;

          // Log successful response
          this.logger.log({
            type: 'response',
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            tenantId,
            userId,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const duration = Date.now() - now;
          const statusCode = error instanceof HttpException ? error.getStatus() : 500;

          // Log error response
          const payload = {
            type: 'error',
            method,
            url,
            statusCode,
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            tenantId,
            userId,
            timestamp: new Date().toISOString(),
          };

          if (statusCode >= 500) {
            this.logger.error(payload);
          } else {
            this.logger.warn(payload);
          }
        },
      }),
    );
  }
}
