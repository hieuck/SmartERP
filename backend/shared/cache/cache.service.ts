import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Cache key namespace
}

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string, namespace?: string): Promise<T | undefined> {
    const fullKey = this.buildKey(key, namespace);
    return await this.cacheManager.get<T>(fullKey);
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.namespace);
    await this.cacheManager.set(fullKey, value, options?.ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string, namespace?: string): Promise<void> {
    const fullKey = this.buildKey(key, namespace);
    await this.cacheManager.del(fullKey);
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string, namespace?: string): Promise<void> {
    const fullPattern = this.buildKey(pattern, namespace);
    const keys = await this.cacheManager.store.keys(fullPattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Wrap a function with caching
   */
  async wrap<T>(key: string, fn: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const fullKey = this.buildKey(key, options?.namespace);
    return await this.cacheManager.wrap(fullKey, fn, options?.ttl);
  }

  /**
   * Build full cache key with namespace
   */
  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.delPattern(`*:${tag}:*`);
    }
  }
}
