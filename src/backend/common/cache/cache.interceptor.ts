import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CacheTTL } from './cache.config';

/**
 * HTTP Cache Interceptor
 *
 * Automatically caches HTTP responses based on:
 * - Request method (GET only)
 * - Request URL
 * - Tenant context
 * - Custom TTL
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key from URL and tenant
    const tenantId = request.user?.tenantId || 'public';
    const url = request.url;
    const cacheKey = `http:${tenantId}:${url}`;

    // Try to get from cache
    const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse) {
      this.logger.debug(`Serving cached response for: ${url}`);
      return of(cachedResponse);
    }

    // Cache miss - execute handler and cache result
    return next.handle().pipe(
      tap(async (response) => {
        // Determine TTL based on endpoint
        const ttl = this.getTTLForEndpoint(url);

        // Cache the response
        await this.cacheService.set(cacheKey, response, ttl);
        this.logger.debug(`Cached response for: ${url} (TTL: ${ttl}s)`);
      }),
    );
  }

  /**
   * Determine TTL based on endpoint pattern
   */
  private getTTLForEndpoint(url: string): number {
    // Dashboard and reports - short TTL (5 min)
    if (url.includes('/dashboard') || url.includes('/reports')) {
      return CacheTTL.SHORT;
    }

    // Settings and reference data - long TTL (24 hours)
    if (url.includes('/settings') || url.includes('/categories')) {
      return CacheTTL.LONG;
    }

    // Products, customers, suppliers - medium TTL (1 hour)
    if (url.includes('/products') || url.includes('/customers') || url.includes('/suppliers')) {
      return CacheTTL.MEDIUM;
    }

    // Default - medium TTL
    return CacheTTL.MEDIUM;
  }
}
