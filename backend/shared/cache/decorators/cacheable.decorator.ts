import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Cache key namespace
  keyGenerator?: (...args: any[]) => string; // Custom key generator
}

/**
 * Decorator to mark a method as cacheable
 * Usage: @Cacheable({ ttl: 300, namespace: 'products' })
 */
export const Cacheable = (options?: CacheableOptions) => SetMetadata(CACHEABLE_KEY, options || {});
