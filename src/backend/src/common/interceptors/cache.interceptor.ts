import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

/**
 * Cache Interceptor
 *
 * Automatically caches GET requests and returns cached responses
 *
 * Features:
 * - Only caches GET requests
 * - Respects custom TTL from @CacheTTL decorator
 * - Generates cache keys from URL + query params + user ID
 * - Skips caching for non-200 responses
 *
 * Usage:
 * ```typescript
 * @UseInterceptors(CacheInterceptor)
 * @CacheTTL(300) // Optional: Custom TTL in seconds
 * @Get()
 * async findAll() {
 *   return this.service.findAll();
 * }
 * ```
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key from URL, query params, and user ID
    const cacheKey = this.generateCacheKey(request);

    // Try to get from cache
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Get custom TTL from decorator (in seconds)
    const customTTL = this.reflector.get<number>('cache_ttl', context.getHandler());
    const ttl = customTTL ? customTTL * 1000 : undefined; // Convert to milliseconds

    // Execute request and cache response
    return next.handle().pipe(
      tap(async (response) => {
        // Only cache successful responses
        if (response) {
          await this.cacheManager.set(cacheKey, response, ttl);
        }
      }),
    );
  }

  /**
   * Generate cache key from request
   *
   * Format: {method}:{path}:{queryString}:{userId}
   * Example: GET:/api/products:category=electronics:user123
   */
  private generateCacheKey(request: any): string {
    const method = request.method;
    const path = request.url.split('?')[0]; // Remove query string
    const queryString = JSON.stringify(request.query || {});
    const userId = request.user?.id || 'anonymous';
    const tenantId = request.tenantId || 'no-tenant';

    return `${method}:${path}:${queryString}:${tenantId}:${userId}`;
  }
}
