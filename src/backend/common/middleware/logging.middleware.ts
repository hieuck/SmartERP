import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      const logMessage = `[${method}] ${originalUrl} - ${statusCode} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(`❌ ${logMessage}`);
      } else if (statusCode >= 400) {
        this.logger.warn(`⚠️  ${logMessage}`);
      } else if (process.env.NODE_ENV === 'development') {
        this.logger.log(`✅ ${logMessage}`);
      }
    });

    next();
  }
}
