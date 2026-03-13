/**
 * Compression Constants
 * 
 * Compression configuration for HTTP responses
 */

/**
 * Compression configuration interface
 */
export interface CompressionConfig {
  enabled: boolean;
  level: number;
  threshold: number;
  memLevel?: number;
  strategy?: number;
}

/**
 * Default compression configuration
 */
export const defaultCompressionConfig: CompressionConfig = {
  enabled: true,
  level: 6, // Balanced compression (1-9)
  threshold: 1024, // Only compress responses > 1KB
  memLevel: 8,
  strategy: 0,
};

/**
 * Brotli compression configuration
 */
export const brotliConfig = {
  enabled: true,
  params: {
    [11]: 4, // Quality (0-11)
  },
};

/**
 * Gzip compression configuration
 */
export const gzipConfig = {
  enabled: true,
  level: 6, // Balanced compression (1-9)
  memLevel: 8,
  strategy: 0,
};

/**
 * MIME types that should be compressed
 */
export const compressibleTypes = [
  'text/html',
  'text/css',
  'text/javascript',
  'text/xml',
  'text/plain',
  'application/javascript',
  'application/json',
  'application/xml',
  'application/xhtml+xml',
  'application/rss+xml',
  'application/atom+xml',
  'image/svg+xml',
] as const;

/**
 * Compression levels
 */
export const CompressionLevel = {
  NONE: 0,
  FASTEST: 1,
  FAST: 3,
  BALANCED: 6,
  BEST: 9,
} as const;
