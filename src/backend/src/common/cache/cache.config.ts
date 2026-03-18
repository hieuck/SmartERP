import KeyvRedis from '@keyv/redis';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

/**
 * Cache Configuration (cache-manager v6 + @keyv/redis)
 *
 * Implements Redis-based caching with:
 * - Multi-tenant isolation
 * - TTL strategies
 * - Cache warming
 * - Distributed caching support
 */

export const getCacheConfig = async (configService: ConfigService): Promise<CacheModuleOptions> => {
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('REDIS_PASSWORD');
  const redisTtl = configService.get<number>('REDIS_TTL', 3600); // 1 hour default

  const redisUrl = redisPassword
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
    : `redis://${redisHost}:${redisPort}`;

  const store = new KeyvRedis(redisUrl);

  return {
    stores: [store],
    ttl: redisTtl * 1000, // cache-manager v6 uses milliseconds
    isGlobal: true,
  };
};

/**
 * Cache TTL Strategies (in seconds)
 */
export const CacheTTL = {
  // Short-lived (5 minutes) - Frequently changing data
  SHORT: 300,

  // Medium-lived (1 hour) - Moderately changing data
  MEDIUM: 3600,

  // Long-lived (24 hours) - Rarely changing data
  LONG: 86400,

  // Very long-lived (7 days) - Static/reference data
  VERY_LONG: 604800,
} as const;

/**
 * Cache Key Prefixes for Multi-tenant Isolation
 */
export const CachePrefix = {
  TENANT: 'tenant',
  USER: 'user',
  PRODUCT: 'product',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  ORDER: 'order',
  INVOICE: 'invoice',
  INVENTORY: 'inventory',
  DASHBOARD: 'dashboard',
  REPORT: 'report',
  SETTINGS: 'settings',
} as const;

/**
 * Generate cache key with tenant isolation
 */
export const generateCacheKey = (
  prefix: string,
  tenantId: string,
  ...parts: (string | number)[]
): string => {
  return `${prefix}:${tenantId}:${parts.join(':')}`;
};
