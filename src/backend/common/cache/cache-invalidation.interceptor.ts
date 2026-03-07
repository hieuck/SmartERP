import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from './cache.service';
import { INVALIDATE_CACHE_METADATA } from './cache.decorator';

/**
 * Cache Invalidation Interceptor
 *
 * Automatically invalidates cache after mutations (POST, PUT, PATCH, DELETE)
 * based on @InvalidateCache decorator or default patterns
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only invalidate on mutations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const tenantId = request.user?.tenantId;
        if (!tenantId) {
          return;
        }

        // Get invalidation prefixes from decorator
        const prefixes = this.reflector.get<string[]>(
          INVALIDATE_CACHE_METADATA,
          context.getHandler(),
        );

        if (prefixes && prefixes.length > 0) {
          // Invalidate specified prefixes
          for (const prefix of prefixes) {
            await this.cacheService.invalidateEntity(prefix, tenantId);
          }
          this.logger.debug(`Invalidated cache for prefixes: ${prefixes.join(', ')}`);
        } else {
          // Auto-detect from URL
          const url = request.url;
          const prefix = this.extractPrefixFromUrl(url);
          if (prefix) {
            await this.cacheService.invalidateEntity(prefix, tenantId);
            this.logger.debug(`Auto-invalidated cache for prefix: ${prefix}`);
          }
        }

        // Also invalidate HTTP cache for this tenant
        const httpCachePattern = `http:${tenantId}:*`;
        await this.cacheService.delPattern(httpCachePattern);
      }),
    );
  }

  /**
   * Extract cache prefix from URL
   */
  private extractPrefixFromUrl(url: string): string | null {
    const patterns = [
      { regex: /\/products/, prefix: 'product' },
      { regex: /\/customers/, prefix: 'customer' },
      { regex: /\/suppliers/, prefix: 'supplier' },
      { regex: /\/orders/, prefix: 'order' },
      { regex: /\/invoices/, prefix: 'invoice' },
      { regex: /\/inventory/, prefix: 'inventory' },
      { regex: /\/settings/, prefix: 'settings' },
      { regex: /\/dashboard/, prefix: 'dashboard' },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(url)) {
        return pattern.prefix;
      }
    }

    return null;
  }
}
