import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);
  private readonly SUCCESS_LOG_EXCLUDED_PATHS = ['/health', '/health/'];

  private shouldSkipSuccessLog(url: string): boolean {
    return this.SUCCESS_LOG_EXCLUDED_PATHS.some(
      (path) => url === path || url.endsWith(path) || url.includes(`${path}/`),
    );
  }

  private isExpectedRefreshMiss(method: string, url: string, statusCode: number): boolean {
    return (
      method === 'POST' &&
      statusCode === 401 &&
      (url === '/api/auth/refresh' || url.endsWith('/api/auth/refresh'))
    );
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const logMessage = `[${method}] ${originalUrl} - ${statusCode} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(`ERROR ${logMessage}`);
      } else if (this.isExpectedRefreshMiss(method, originalUrl, statusCode)) {
        this.logger.log(`EXPECTED ${logMessage}`);
      } else if (statusCode >= 400) {
        this.logger.warn(`WARN ${logMessage}`);
      } else if (
        process.env.NODE_ENV === 'development' &&
        !this.shouldSkipSuccessLog(originalUrl)
      ) {
        this.logger.log(`OK ${logMessage}`);
      }
    });

    next();
  }
}
