/**
 * Product variant selection interface
 * Flexible structure for different product types
 */
export interface ProductVariant {
  [key: string]: string | number | boolean;
}

/**
 * Common variant examples:
 * - Clothing: { size: 'M', color: 'Red' }
 * - Electronics: { storage: '256GB', color: 'Black' }
 * - Books: { format: 'Hardcover', language: 'English' }
 */
