/**
 * CDN Constants
 * 
 * CDN configuration, cache strategies, and headers
 */

/**
 * Cache strategies for different content types
 */
export const cacheStrategies = {
  // Static assets (images, fonts, etc.) - 1 year
  static: {
    maxAge: 31536000,
    sMaxAge: 31536000,
    staleWhileRevalidate: 86400,
  },
  
  // API responses - 5 minutes
  api: {
    maxAge: 300,
    sMaxAge: 300,
    staleWhileRevalidate: 60,
  },
  
  // Dynamic content - 1 minute
  dynamic: {
    maxAge: 60,
    sMaxAge: 60,
    staleWhileRevalidate: 30,
  },
  
  // No cache
  noCache: {
    maxAge: 0,
    sMaxAge: 0,
    noCache: true,
    noStore: true,
  },
  
  // Public content - 1 hour
  public: {
    maxAge: 3600,
    sMaxAge: 3600,
    public: true,
  },
} as const;

/**
 * CDN-specific headers
 */
export const cdnHeaders = {
  // Cloudflare
  cloudflare: {
    cacheControl: 'CF-Cache-Status',
    ray: 'CF-RAY',
    cacheTag: 'Cache-Tag',
  },
  
  // AWS CloudFront
  cloudfront: {
    cacheControl: 'X-Cache',
    requestId: 'X-Amz-Cf-Id',
  },
  
  // Fastly
  fastly: {
    cacheControl: 'X-Cache',
    cacheHits: 'X-Cache-Hits',
  },
} as const;

/**
 * Security headers for CDN
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * CORS headers for CDN
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID',
  'Access-Control-Max-Age': '86400',
} as const;

/**
 * Compression hints for CDN
 */
export const compressionHeaders = {
  'Content-Encoding': 'gzip',
  'Vary': 'Accept-Encoding',
} as const;
