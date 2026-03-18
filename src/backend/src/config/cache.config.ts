import KeyvRedis from '@keyv/redis';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis Cache Configuration (cache-manager v6 + @keyv/redis)
 *
 * Environment Variables:
 * - REDIS_HOST: Redis server host (default: localhost)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - CACHE_TTL: Default cache TTL in seconds (default: 300 = 5 minutes)
 */
export const getCacheConfig = async (configService: ConfigService): Promise<CacheModuleOptions> => {
  const logger = new Logger('CacheConfig');
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('REDIS_PASSWORD');
  const redisDb = configService.get<number>('REDIS_DB', 0);
  const cacheTtl = configService.get<number>('CACHE_TTL', 300); // seconds

  const redisUrl = redisPassword
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}/${redisDb}`
    : `redis://${redisHost}:${redisPort}/${redisDb}`;

  logger.log(`CacheConfig: connecting to Redis at ${redisHost}:${redisPort}`);

  const store = new KeyvRedis(redisUrl);

  return {
    stores: [store],
    ttl: cacheTtl * 1000, // cache-manager v6 uses milliseconds
    isGlobal: true,
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
