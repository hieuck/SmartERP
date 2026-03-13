/**
 * Format Utilities
 * 
 * Common formatting functions for dates, numbers, currency, etc.
 */

/**
 * Format date to ISO string
 * 
 * @param date - Date to format
 * @returns ISO date string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

/**
 * Format date to locale string
 * 
 * @param date - Date to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDateLocale = (date: Date | string, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale);
};

/**
 * Format number with thousand separators
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format currency
 * 
 * @param value - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Format percentage
 * 
 * @param value - Value to format (0-1 or 0-100)
 * @param decimals - Number of decimal places
 * @param isDecimal - Whether value is in decimal format (0-1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2,
  isDecimal: boolean = true,
): string => {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format file size
 * 
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format phone number
 * 
 * @param phone - Phone number to format
 * @param format - Format pattern (default: '(XXX) XXX-XXXX')
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string, format: string = '(XXX) XXX-XXXX'): string => {
  const cleaned = phone.replace(/\D/g, '');
  let formatted = format;
  
  for (const digit of cleaned) {
    formatted = formatted.replace('X', digit);
  }
  
  return formatted.replace(/X/g, '');
};

/**
 * Truncate string with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string
 */
export const truncate = (text: string, maxLength: number, ellipsis: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Capitalize first letter
 * 
 * @param text - Text to capitalize
 * @returns Capitalized string
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert to title case
 * 
 * @param text - Text to convert
 * @returns Title case string
 */
export const toTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};
