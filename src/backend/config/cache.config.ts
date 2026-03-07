import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';

/**
 * Redis Cache Configuration
 * 
 * Features:
 * - Redis-based caching for high performance
 * - Configurable TTL (Time To Live)
 * - Connection pooling
 * - Error handling with fallback
 * 
 * Environment Variables:
 * - REDIS_HOST: Redis server host (default: localhost)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - CACHE_TTL: Default cache TTL in seconds (default: 300 = 5 minutes)
 * - CACHE_MAX: Maximum number of items in cache (default: 100)
 */
export const getCacheConfig = async (
  configService: ConfigService,
): Promise<CacheModuleOptions<RedisClientOptions>> => {
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('REDIS_PASSWORD');
  const redisDb = configService.get<number>('REDIS_DB', 0);
  const cacheTtl = configService.get<number>('CACHE_TTL', 300); // 5 minutes default
  const cacheMax = configService.get<number>('CACHE_MAX', 100);

  return {
    store: await redisStore({
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword,
      database: redisDb,
      // Connection options
      lazyConnect: true, // Connect on first use
      enableOfflineQueue: true, // Queue commands when offline
      // Retry strategy
      retryStrategy: (times: number) => {
        if (times > 3) {
          // Stop retrying after 3 attempts
          console.error('Redis connection failed after 3 attempts');
          return null;
        }
        // Exponential backoff: 100ms, 200ms, 400ms
        return Math.min(times * 100, 3000);
      },
    }),
    ttl: cacheTtl * 1000, // Convert to milliseconds
    max: cacheMax,
    // Global cache options
    isGlobal: true, // Make cache available globally
  };
};

/**
 * Cache Key Prefixes
 * 
 * Use these prefixes to organize cache keys by domain
 */
export const CacheKeyPrefix = {
  USER: 'user:',
  PRODUCT: 'product:',
  ORDER: 'order:',
  CUSTOMER: 'customer:',
  INVENTORY: 'inventory:',
  REPORT: 'report:',
  NOTIFICATION: 'notification:',
} as const;

/**
 * Cache TTL Constants (in seconds)
 * 
 * Different data types have different cache durations
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - default
  LONG: 3600, // 1 hour - for relatively static data
  VERY_LONG: 86400, // 24 hours - for rarely changing data
} as const;
