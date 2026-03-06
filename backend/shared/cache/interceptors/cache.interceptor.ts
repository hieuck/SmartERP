import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { CACHEABLE_KEY, CacheableOptions } from '../decorators/cacheable.decorator';
import {
  CACHE_INVALIDATE_KEY,
  CacheInvalidateOptions,
} from '../decorators/cache-invalidate.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheableOptions = this.reflector.get<CacheableOptions>(
      CACHEABLE_KEY,
      context.getHandler(),
    );

    const invalidateOptions = this.reflector.get<CacheInvalidateOptions>(
      CACHE_INVALIDATE_KEY,
      context.getHandler(),
    );

    // Handle cache invalidation
    if (invalidateOptions) {
      return next.handle().pipe(
        tap(async () => {
          await this.invalidateCache(invalidateOptions);
        }),
      );
    }

    // Handle caching
    if (cacheableOptions) {
      const request = context.switchToHttp().getRequest();
      const cacheKey = this.generateCacheKey(request, cacheableOptions, context);

      // Try to get from cache
      const cachedValue = await this.cacheService.get(cacheKey, cacheableOptions.namespace);

      if (cachedValue !== undefined) {
        return of(cachedValue);
      }

      // Execute and cache the result
      return next.handle().pipe(
        tap(async (data) => {
          await this.cacheService.set(cacheKey, data, {
            ttl: cacheableOptions.ttl,
            namespace: cacheableOptions.namespace,
          });
        }),
      );
    }

    return next.handle();
  }

  private generateCacheKey(
    request: any,
    options: CacheableOptions,
    context: ExecutionContext,
  ): string {
    if (options.keyGenerator) {
      return options.keyGenerator(...context.getArgs());
    }

    // Default key generation: method:url:params
    const method = request.method;
    const url = request.url;
    const params = JSON.stringify(request.query || {});
    return `${method}:${url}:${params}`;
  }

  private async invalidateCache(options: CacheInvalidateOptions): Promise<void> {
    // Invalidate by specific keys
    if (options.keys && options.keys.length > 0) {
      await Promise.all(options.keys.map((key) => this.cacheService.del(key, options.namespace)));
    }

    // Invalidate by patterns
    if (options.patterns && options.patterns.length > 0) {
      await Promise.all(
        options.patterns.map((pattern) => this.cacheService.delPattern(pattern, options.namespace)),
      );
    }

    // Invalidate by tags
    if (options.tags && options.tags.length > 0) {
      await this.cacheService.invalidateByTags(options.tags);
    }

    // Invalidate entire namespace
    if (options.namespace && !options.keys && !options.patterns && !options.tags) {
      await this.cacheService.delPattern('*', options.namespace);
    }
  }
}
