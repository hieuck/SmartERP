import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: LoggerService;

  constructor() {
    this.logger = new LoggerService();
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Extract user and tenant from JWT (if authenticated)
    const user = (req as Request & { user?: { id?: string; tenantId?: string } }).user;
    const userId = user?.id;
    const tenantId = user?.tenantId;

    // Log request
    this.logger.log(
      `Incoming ${method} ${originalUrl} - ${JSON.stringify({
        method,
        url: originalUrl,
        ip,
        userAgent,
        userId,
        tenantId,
      })}`,
    );

    // Log response
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      this.logger.logRequest(method, originalUrl, statusCode, responseTime, userId, tenantId);

      // Log slow requests (>1000ms)
      if (responseTime > 1000) {
        this.logger.warn(
          `Slow request detected: ${method} ${originalUrl} - ${JSON.stringify({
            method,
            url: originalUrl,
            responseTime,
            statusCode,
            userId,
            tenantId,
          })}`,
        );
      }

      // Log errors (5xx status codes)
      if (statusCode >= 500) {
        this.logger.error(
          `Server error: ${method} ${originalUrl} - ${JSON.stringify({
            method,
            url: originalUrl,
            statusCode,
            responseTime,
            userId,
            tenantId,
          })}`,
          '',
        );
      }
    });

    next();
  }
}
