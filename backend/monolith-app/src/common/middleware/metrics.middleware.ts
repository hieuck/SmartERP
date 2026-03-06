import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    // Extract route pattern (remove IDs and query params)
    const route = this.extractRoute(originalUrl);

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      const { statusCode } = res;

      // Record HTTP metrics
      this.metricsService.recordHttpRequest(method, route, statusCode, duration);
    });

    next();
  }

  private extractRoute(url: string): string {
    // Remove query parameters
    const path = url.split('?')[0];

    // Replace UUIDs and numeric IDs with placeholders
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }
}
