import { SetMetadata } from '@nestjs/common';

/**
 * Cache Decorators
 *
 * Provides decorators for controlling caching behavior
 */

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_SKIP_METADATA = 'cache:skip';

/**
 * Set custom cache key for endpoint
 *
 * @example
 * @CacheKey('products:list')
 * @Get()
 * findAll() { ... }
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);

/**
 * Set custom TTL for endpoint (in seconds)
 *
 * @example
 * @CacheTTL(3600) // 1 hour
 * @Get()
 * findAll() { ... }
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Skip caching for this endpoint
 *
 * @example
 * @SkipCache()
 * @Get('sensitive')
 * getSensitiveData() { ... }
 */
export const SkipCache = () => SetMetadata(CACHE_SKIP_METADATA, true);

/**
 * Invalidate cache after mutation
 *
 * @example
 * @InvalidateCache('products')
 * @Post()
 * create() { ... }
 */
export const INVALIDATE_CACHE_METADATA = 'cache:invalidate';
export const InvalidateCache = (...prefixes: string[]) =>
  SetMetadata(INVALIDATE_CACHE_METADATA, prefixes);
