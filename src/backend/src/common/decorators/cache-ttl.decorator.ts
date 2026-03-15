import { SetMetadata } from '@nestjs/common';

/**
 * Cache TTL Decorator
 *
 * Sets custom cache TTL (Time To Live) for a specific endpoint
 *
 * Usage:
 * ```typescript
 * @CacheTTL(300) // Cache for 5 minutes
 * @Get()
 * async findAll() {
 *   return this.service.findAll();
 * }
 * ```
 *
 * @param ttl - Time to live in seconds
 */
export const CacheTTL = (ttl: number) => SetMetadata('cache_ttl', ttl);
