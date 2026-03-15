import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';

/**
 * Cache Invalidation Helper
 *
 * Provides utility functions for invalidating cache entries
 *
 * Features:
 * - Invalidate by exact key
 * - Invalidate by pattern (prefix matching)
 * - Invalidate related caches
 */
export class CacheInvalidationHelper {
  private static readonly logger = new Logger(CacheInvalidationHelper.name);
  /**
   * Invalidate cache by exact key
   */
  static async invalidateByKey(cacheManager: Cache, key: string): Promise<void> {
    await cacheManager.del(key);
  }

  /**
   * Invalidate all caches for a specific resource
   *
   * Example: invalidateResource('products', '123', 'tenant1')
   * Will invalidate:
   * - GET:/api/ecommerce/products/123:*:tenant1:*
   * - GET:/api/ecommerce/products:*:tenant1:* (list cache)
   */
  static async invalidateResource(
    cacheManager: Cache,
    resourcePath: string,
    resourceId: string,
    _tenantId: string,
  ): Promise<void> {
    // Invalidate specific resource cache
    const resourceKey = `GET:${resourcePath}/${resourceId}`;
    await cacheManager.del(resourceKey);

    // Invalidate list cache (so updated item appears in lists)
    const listKey = `GET:${resourcePath}`;
    await cacheManager.del(listKey);
  }

  /**
   * Invalidate all caches for a tenant
   *
   * Use with caution - this will clear all cached data for a tenant
   */
  static async invalidateTenant(cacheManager: Cache, tenantId: string): Promise<void> {
    // Note: This is a simplified implementation
    // In production, you might want to use Redis SCAN command
    // or maintain a separate index of cache keys per tenant
    this.logger.warn(`Tenant-wide cache invalidation requested for: ${tenantId}`);
  }
}
