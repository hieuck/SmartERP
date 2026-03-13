/**
 * Cache Constants
 * 
 * Cache key prefixes and TTL values for consistent caching across the application
 */

/**
 * Cache key prefixes for organizing cache entries
 */
export const CacheKeyPrefix = {
  USER: 'user:',
  PRODUCT: 'product:',
  ORDER: 'order:',
  CUSTOMER: 'customer:',
  SUPPLIER: 'supplier:',
  INVOICE: 'invoice:',
  REPORT: 'report:',
  DASHBOARD: 'dashboard:',
  SETTINGS: 'settings:',
} as const;

/**
 * Cache prefix for multi-tenant isolation
 */
export const CachePrefix = {
  TENANT: 'tenant',
  USER: 'user',
  PRODUCT: 'product',
  ORDER: 'order',
  CUSTOMER: 'customer',
  INVOICE: 'invoice',
  REPORT: 'report',
  SESSION: 'session',
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  // Short-lived (1-5 minutes) - Frequently changing data
  SHORT: 60,
  VERY_SHORT: 30,
  
  // Medium-lived (5-15 minutes) - Default for most data
  MEDIUM: 300,
  MEDIUM_LONG: 900,
  
  // Long-lived (1-24 hours) - Rarely changing data
  LONG: 3600,
  VERY_LONG: 86400,
  
  // Specific use cases
  SESSION: 1800, // 30 minutes
  REPORT: 600, // 10 minutes
  DASHBOARD: 300, // 5 minutes
  SETTINGS: 3600, // 1 hour
  STATIC: 86400, // 24 hours
} as const;

/**
 * Cache metadata keys
 */
export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_SKIP_METADATA = 'cache:skip';
export const INVALIDATE_CACHE_METADATA = 'cache:invalidate';
