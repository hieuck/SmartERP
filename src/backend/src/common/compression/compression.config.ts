import { constants } from 'zlib';

/**
 * Compression Configuration
 *
 * Configures gzip and brotli compression for API responses
 * to reduce bandwidth and improve response times
 */

export interface CompressionConfig {
  // Enable compression
  enabled: boolean;

  // Compression level (0-9 for gzip, 0-11 for brotli)
  level: number;

  // Minimum response size to compress (bytes)
  threshold: number;

  // MIME types to compress
  filter: (
    req: { headers: Record<string, string | string[] | undefined> },
    _res: unknown,
  ) => boolean;
}

/**
 * Default compression configuration
 */
export const defaultCompressionConfig: CompressionConfig = {
  enabled: true,
  level: 6, // Balanced compression
  threshold: 1024, // 1KB minimum
  filter: (req, _res) => {
    // Don't compress if client doesn't accept encoding
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter from compression library
    return true;
  },
};

/**
 * Brotli compression configuration
 */
export const brotliConfig = {
  enabled: true,
  params: {
    // Brotli compression level (0-11)
    // 4 = balanced, 11 = maximum compression
    [constants.BROTLI_PARAM_QUALITY]: 4,

    // Window size (10-24)
    [constants.BROTLI_PARAM_LGWIN]: 22,
  },
};

/**
 * Gzip compression configuration
 */
export const gzipConfig = {
  enabled: true,
  level: 6, // Balanced compression (1-9)
  memLevel: 8, // Memory usage (1-9)
  strategy: constants.Z_DEFAULT_STRATEGY,
};

/**
 * MIME types that should be compressed
 */
export const compressibleTypes = [
  'text/html',
  'text/css',
  'text/plain',
  'text/xml',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'application/xhtml+xml',
  'application/rss+xml',
  'application/atom+xml',
  'image/svg+xml',
];

/**
 * Get compression ratio for monitoring
 */
export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
  if (originalSize === 0) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
};
