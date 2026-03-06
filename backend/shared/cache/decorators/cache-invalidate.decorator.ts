import { SetMetadata } from '@nestjs/common';

export const CACHE_INVALIDATE_KEY = 'cache_invalidate';

export interface CacheInvalidateOptions {
  namespace?: string; // Cache namespace to invalidate
  keys?: string[]; // Specific keys to invalidate
  patterns?: string[]; // Patterns to match for invalidation
  tags?: string[]; // Tags to invalidate
}

/**
 * Decorator to mark a method that should invalidate cache
 * Usage: @CacheInvalidate({ namespace: 'products', patterns: ['product:*'] })
 */
export const CacheInvalidate = (options?: CacheInvalidateOptions) =>
  SetMetadata(CACHE_INVALIDATE_KEY, options || {});
