/**
 * Cache Utilities
 * 
 * Helper functions for cache key generation and invalidation
 */

/**
 * Generate cache key with tenant isolation
 * 
 * @param prefix - Cache key prefix
 * @param tenantId - Tenant ID
 * @param identifier - Resource identifier
 * @param suffix - Optional suffix
 * @returns Generated cache key
 */
export const generateCacheKey = (
  prefix: string,
  tenantId: string,
  identifier?: string,
  suffix?: string,
): string => {
  const parts = [prefix, tenantId];
  
  if (identifier) {
    parts.push(identifier);
  }
  
  if (suffix) {
    parts.push(suffix);
  }
  
  return parts.join(':');
};

/**
 * Parse cache key into components
 * 
 * @param key - Cache key to parse
 * @returns Parsed components
 */
export const parseCacheKey = (
  key: string,
): { prefix: string; tenantId: string; identifier?: string; suffix?: string } => {
  const parts = key.split(':');
  
  return {
    prefix: parts[0] || '',
    tenantId: parts[1] || '',
    identifier: parts[2],
    suffix: parts[3],
  };
};

/**
 * Generate cache key pattern for invalidation
 * 
 * @param prefix - Cache key prefix
 * @param tenantId - Tenant ID
 * @returns Cache key pattern (e.g., "product:tenant-1:*")
 */
export const generateCacheKeyPattern = (prefix: string, tenantId: string): string => {
  return `${prefix}:${tenantId}:*`;
};

/**
 * Calculate cache TTL with jitter
 * 
 * Adds random jitter to prevent cache stampede
 * 
 * @param baseTTL - Base TTL in seconds
 * @param jitterPercent - Jitter percentage (0-100)
 * @returns TTL with jitter applied
 */
export const calculateTTLWithJitter = (baseTTL: number, jitterPercent: number = 10): number => {
  const jitter = baseTTL * (jitterPercent / 100);
  const randomJitter = Math.random() * jitter * 2 - jitter;
  return Math.floor(baseTTL + randomJitter);
};

/**
 * Check if cache key matches pattern
 * 
 * @param key - Cache key to check
 * @param pattern - Pattern to match (supports * wildcard)
 * @returns True if key matches pattern
 */
export const matchesCacheKeyPattern = (key: string, pattern: string): boolean => {
  const regexPattern = pattern.replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(key);
};
