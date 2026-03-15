import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
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
  const logger = new Logger('CacheConfig');
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('REDIS_PASSWORD');
  const redisDb = configService.get<number>('REDIS_DB', 0);
  const cacheTtl = configService.get<number>('CACHE_TTL', 300); // 5 minutes default
  const cacheMax = configService.get<number>('CACHE_MAX', 100);

  const MAX_REDIS_RETRIES = 3;

  return {
    store: await redisStore({
      socket: {
        host: redisHost,
        port: redisPort,
        reconnectStrategy: (retries: number) => {
          if (retries > MAX_REDIS_RETRIES) {
            // Stop retrying after max attempts
            logger.error(`Redis connection failed after ${MAX_REDIS_RETRIES} attempts`);
            return false;
          }
          // Exponential backoff: 100ms, 200ms, 400ms
          const BACKOFF_BASE_MS = 100;
          const MAX_BACKOFF_MS = 3000;
          return Math.min(retries * BACKOFF_BASE_MS, MAX_BACKOFF_MS);
        },
      },
      password: redisPassword,
      database: redisDb,
      // Connection options
      // lazyConnect: true, // Connect on first use - deprecated in redis v4
      disableOfflineQueue: false, // Queue commands when offline
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
