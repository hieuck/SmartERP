/**
 * CDN Configuration
 *
 * Configures CDN headers and caching strategies
 * for optimal content delivery
 */

export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'cloudfront' | 'fastly' | 'custom';
  domain?: string;
  headers: CDNHeaders;
}

export interface CDNHeaders {
  cacheControl: string;
  maxAge: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
}

/**
 * Cache strategies for different content types
 */
export const cacheStrategies = {
  // Static assets (images, fonts, etc.) - 1 year
  static: {
    cacheControl: 'public, max-age=31536000, immutable',
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
  },

  // API responses - 5 minutes with revalidation
  api: {
    cacheControl: 'private, max-age=300, must-revalidate',
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
  },

  // Dynamic content - 1 minute with revalidation
  dynamic: {
    cacheControl: 'private, max-age=60, must-revalidate',
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30, // 30 seconds
  },

  // No cache - always fresh
  noCache: {
    cacheControl: 'no-cache, no-store, must-revalidate',
    maxAge: 0,
  },

  // Public content - 1 hour
  public: {
    cacheControl: 'public, max-age=3600',
    maxAge: 3600, // 1 hour
    sMaxAge: 7200, // 2 hours for CDN
    staleWhileRevalidate: 300, // 5 minutes
  },
};

/**
 * Get cache headers for content type
 */
export const getCacheHeaders = (
  contentType: 'static' | 'api' | 'dynamic' | 'noCache' | 'public',
): Record<string, string> => {
  const strategy = cacheStrategies[contentType];

  return {
    'Cache-Control': strategy.cacheControl,
    'X-Content-Type': contentType,
  };
};

/**
 * CDN-specific headers
 */
export const cdnHeaders = {
  // Cloudflare
  cloudflare: {
    'CF-Cache-Status': 'HIT', // HIT, MISS, EXPIRED, BYPASS
    'CF-Ray': '', // Request ID
    'CF-Cache-Tag': '', // Cache tags for purging
  },

  // CloudFront
  cloudfront: {
    'X-Cache': 'Hit from cloudfront',
    'X-Amz-Cf-Pop': '', // Edge location
    'X-Amz-Cf-Id': '', // Request ID
  },

  // Fastly
  fastly: {
    'X-Cache': 'HIT',
    'X-Cache-Hits': '1',
    'X-Served-By': '',
  },
};

/**
 * Security headers for CDN
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * CORS headers for CDN
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Compression hints for CDN
 */
export const compressionHeaders = {
  'Content-Encoding': 'gzip', // or 'br' for brotli
  Vary: 'Accept-Encoding',
};

/**
 * Generate cache key for CDN
 */
export const generateCacheKey = (url: string, tenantId: string, userId?: string): string => {
  const parts = [url, tenantId];
  if (userId) parts.push(userId);
  return parts.join(':');
};

/**
 * Check if content should be cached
 */
export const shouldCache = (method: string, statusCode: number, contentType?: string): boolean => {
  // Only cache GET requests
  if (method !== 'GET') return false;

  // Only cache successful responses
  if (statusCode < 200 || statusCode >= 300) return false;

  // Don't cache certain content types
  const noCacheTypes = ['text/event-stream', 'multipart/form-data'];
  if (contentType && noCacheTypes.some((type) => contentType.includes(type))) {
    return false;
  }

  return true;
};
