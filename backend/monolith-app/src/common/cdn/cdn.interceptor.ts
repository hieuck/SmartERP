import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getCacheHeaders, securityHeaders, shouldCache } from './cdn.config';

/**
 * CDN Headers Interceptor
 *
 * Adds appropriate cache headers for CDN optimization
 * Implements cache strategies based on content type
 */
@Injectable()
export class CDNInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        const method = request.method;
        const statusCode = response.statusCode;
        const url = request.url;

        // Determine cache strategy based on URL
        const cacheType = this.getCacheType(url);

        // Check if should cache
        if (shouldCache(method, statusCode)) {
          // Add cache headers
          const cacheHeaders = getCacheHeaders(cacheType);
          Object.entries(cacheHeaders).forEach(([key, value]) => {
            response.setHeader(key, value);
          });
        } else {
          // No cache headers
          const noCacheHeaders = getCacheHeaders('noCache');
          Object.entries(noCacheHeaders).forEach(([key, value]) => {
            response.setHeader(key, value);
          });
        }

        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.setHeader(key, value);
        });

        // Add CDN identification header
        response.setHeader('X-CDN-Enabled', 'true');
      }),
    );
  }

  /**
   * Determine cache type based on URL
   */
  private getCacheType(url: string): 'static' | 'api' | 'dynamic' | 'noCache' | 'public' {
    // Static assets
    if (url.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)) {
      return 'static';
    }

    // Public endpoints (no auth required)
    if (url.includes('/public/') || url.includes('/health')) {
      return 'public';
    }

    // API endpoints
    if (url.startsWith('/api/')) {
      // Check for dynamic content
      if (
        url.includes('/dashboard') ||
        url.includes('/notifications') ||
        url.includes('/realtime')
      ) {
        return 'dynamic';
      }

      // Check for no-cache endpoints
      if (url.includes('/auth/') || url.includes('/payment/') || url.includes('/checkout/')) {
        return 'noCache';
      }

      return 'api';
    }

    // Default to dynamic
    return 'dynamic';
  }
}

/**
 * Static Asset CDN Interceptor
 * Optimized for static assets with long cache times
 */
@Injectable()
export class StaticAssetCDNInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        // Long cache for static assets
        const cacheHeaders = getCacheHeaders('static');
        Object.entries(cacheHeaders).forEach(([key, value]) => {
          response.setHeader(key, value);
        });

        // Add immutable flag
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.setHeader(key, value);
        });
      }),
    );
  }
}
