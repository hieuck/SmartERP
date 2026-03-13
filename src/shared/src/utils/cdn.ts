/**
 * CDN Utilities
 * 
 * Helper functions for CDN cache headers and optimization
 */

import { cacheStrategies } from '../constants/cdn';

/**
 * Get cache headers for content type
 * 
 * @param contentType - Content type (static, api, dynamic, noCache, public)
 * @returns Cache-Control header value
 */
export const getCacheHeaders = (
  contentType: 'static' | 'api' | 'dynamic' | 'noCache' | 'public',
): Record<string, string> => {
  const strategy = cacheStrategies[contentType];
  
  if ('noCache' in strategy && strategy.noCache) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }
  
  const parts: string[] = [];
  
  if ('public' in strategy && strategy.public) {
    parts.push('public');
  } else {
    parts.push('private');
  }
  
  if ('maxAge' in strategy) {
    parts.push(`max-age=${strategy.maxAge}`);
  }
  
  if ('sMaxAge' in strategy) {
    parts.push(`s-maxage=${strategy.sMaxAge}`);
  }
  
  if ('staleWhileRevalidate' in strategy) {
    parts.push(`stale-while-revalidate=${strategy.staleWhileRevalidate}`);
  }
  
  return {
    'Cache-Control': parts.join(', '),
  };
};

/**
 * Generate CDN cache key
 * 
 * @param url - Request URL
 * @param tenantId - Tenant ID
 * @param userId - Optional user ID
 * @returns Generated cache key
 */
export const generateCdnCacheKey = (url: string, tenantId: string, userId?: string): string => {
  const parts = [url, tenantId];
  if (userId) parts.push(userId);
  return parts.join('|');
};

/**
 * Check if content should be cached
 * 
 * @param method - HTTP method
 * @param statusCode - HTTP status code
 * @param contentType - Optional content type
 * @returns True if content should be cached
 */
export const shouldCache = (method: string, statusCode: number, contentType?: string): boolean => {
  // Only cache GET requests
  if (method !== 'GET') return false;
  
  // Only cache successful responses
  if (statusCode < 200 || statusCode >= 300) return false;
  
  // Don't cache certain content types
  if (contentType) {
    const noCacheTypes = ['application/json', 'text/html'];
    if (noCacheTypes.some(type => contentType.includes(type))) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get compression ratio for monitoring
 * 
 * @param originalSize - Original size in bytes
 * @param compressedSize - Compressed size in bytes
 * @returns Compression ratio as percentage
 */
export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
  if (originalSize === 0) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
};

/**
 * Calculate bandwidth saved
 * 
 * @param originalSize - Original size in bytes
 * @param compressedSize - Compressed size in bytes
 * @returns Bandwidth saved in bytes
 */
export const calculateBandwidthSaved = (originalSize: number, compressedSize: number): number => {
  return Math.max(0, originalSize - compressedSize);
};
