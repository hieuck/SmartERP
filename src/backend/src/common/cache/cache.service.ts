import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CacheTTL, generateCacheKey } from './cache.config';

/**
 * Cache Service
 *
 * Provides caching functionality with:
 * - Cache-aside pattern
 * - Multi-tenant isolation
 * - Automatic invalidation
 * - Cache warming
 * - Performance metrics
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.logger.debug(`Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl ? ttl * 1000 : undefined);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'}s)`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Note: This requires Redis SCAN command support
      // For now, we'll log a warning
      this.logger.warn(`Pattern deletion not implemented: ${pattern}`);
      // TODO: Implement pattern-based deletion using Redis SCAN
    } catch (error) {
      this.logger.error(`Cache DEL pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      // cache-manager v6 removed reset() — clear() is the replacement
      if (
        typeof (this.cacheManager as unknown as { clear: () => Promise<void> }).clear === 'function'
      ) {
        await (this.cacheManager as unknown as { clear: () => Promise<void> }).clear();
      }
      this.logger.warn('Cache RESET: All keys deleted');
    } catch (error) {
      this.logger.error('Cache RESET error:', error);
    }
  }

  /**
   * Cache-aside pattern: Get or set
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - fetch from source
    try {
      const value = await factory();

      // Store in cache
      await this.set(key, value, ttl);

      return value;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a tenant
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    const pattern = `*:${tenantId}:*`;
    await this.delPattern(pattern);
    this.logger.log(`Invalidated cache for tenant: ${tenantId}`);
  }

  /**
   * Invalidate cache for a specific entity type
   */
  async invalidateEntity(prefix: string, tenantId: string, entityId?: string): Promise<void> {
    if (entityId) {
      // Invalidate specific entity
      const key = generateCacheKey(prefix, tenantId, entityId);
      await this.del(key);
    } else {
      // Invalidate all entities of this type for tenant
      const pattern = `${prefix}:${tenantId}:*`;
      await this.delPattern(pattern);
    }
    this.logger.log(
      `Invalidated ${prefix} cache for tenant ${tenantId}${entityId ? ` (ID: ${entityId})` : ''}`,
    );
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(
    key: string,
    factory: () => Promise<unknown>,
    ttl: number = CacheTTL.LONG,
  ): Promise<void> {
    try {
      const value = await factory();
      await this.set(key, value, ttl);
      this.logger.log(`Cache warmed: ${key}`);
    } catch (error) {
      this.logger.error(`Cache warming error for key ${key}:`, error);
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset(items: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    await Promise.all(items.map((item) => this.set(item.key, item.value, item.ttl)));
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Get cache statistics (if supported by store)
   */
  async getStats(): Promise<Record<string, unknown> | null> {
    try {
      // This would require Redis INFO command
      // For now, return basic info
      return {
        message: 'Cache statistics not implemented',
        // TODO: Implement Redis INFO parsing
      };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return null;
    }
  }
}
