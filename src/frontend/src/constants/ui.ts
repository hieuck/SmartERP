/**
 * UI Constants
 * Standardized colors, dimensions, and formats for the entire system
 * Note: All text labels/messages have been moved to i18n (common-ui namespace)
 */

import dayjs from 'dayjs';

// ============================================
// COLORS (Ant Design semantic colors)
// ============================================

export const STATUS_COLORS = {
  active: 'green',
  inactive: 'red',
  pending: 'orange',
  completed: 'blue',
  cancelled: 'gray',
  draft: 'default',
  approved: 'green',
  rejected: 'red',
  in_progress: 'blue',
  paused: 'orange',
} as const;

export const TYPE_COLORS = {
  individual: 'blue',
  business: 'green',
  reseller: 'orange',
  vip: 'gold',
} as const;

export const SPECIALTY_COLORS = {
  casting: 'blue',
  painting: 'green',
  finishing: 'orange',
  packaging: 'purple',
  general: 'default',
} as const;

export const PRIORITY_COLORS = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
} as const;

// ============================================
// DIMENSIONS
// ============================================

export const COLUMN_WIDTHS = {
  code: 100,
  name: 200,
  phone: 120,
  email: 180,
  price: 120,
  quantity: 100,
  status: 100,
  date: 120,
  datetime: 160,
  actions: 150,
  checkbox: 50,
} as const;

export const INPUT_WIDTHS = {
  search: 300,
  filter: 150,
  select: 150,
  date: 200,
  number: 120,
} as const;

export const CARD_PADDING = {
  header: '0 24px',
  body: '0',
  searchArea: '16px 24px',
} as const;

export const SPACING = {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: ['10', '20', '50', '100'],
  showSizeChanger: true,
} as const;

// ============================================
// FORMATS
// ============================================

export const DATE_FORMATS = {
  date: 'DD/MM/YYYY',
  datetime: 'DD/MM/YYYY HH:mm',
  time: 'HH:mm',
  month: 'MM/YYYY',
  year: 'YYYY',
} as const;

export const NUMBER_FORMATS = {
  currency: (value: number, locale = 'vi-VN', currency = 'VND') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  },
  number: (value: number, locale = 'vi-VN') => {
    return new Intl.NumberFormat(locale).format(value);
  },
  percent: (value: number, decimals = 2) => {
    return value.toFixed(decimals) + '%';
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status color based on status key
 */
export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'default';
};

/**
 * Get type color based on type key
 */
export const getTypeColor = (type: string): string => {
  return TYPE_COLORS[type as keyof typeof TYPE_COLORS] || 'default';
};

/**
 * Get specialty color based on specialty key
 */
export const getSpecialtyColor = (specialty: string): string => {
  return SPECIALTY_COLORS[specialty as keyof typeof SPECIALTY_COLORS] || 'default';
};

/**
 * Get priority color based on priority key
 */
export const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'default';
};

/**
 * Format currency value
 * @param value - Number to format
 * @param locale - Locale string (default: vi-VN)
 * @param currency - Currency code (default: VND)
 */
export const formatCurrency = (
  value: number | null | undefined,
  locale = 'vi-VN',
  currency = 'VND',
): string => {
  if (value === null || value === undefined) return '0';
  return NUMBER_FORMATS.currency(value, locale, currency);
};

/**
 * Format number value
 * @param value - Number to format
 * @param locale - Locale string (default: vi-VN)
 */
export const formatNumber = (value: number | null | undefined, locale = 'vi-VN'): string => {
  if (value === null || value === undefined) return '0';
  return NUMBER_FORMATS.number(value, locale);
};

/**
 * Format date value
 * @param date - Date to format
 * @param format - Format key from DATE_FORMATS
 */
export const formatDate = (
  date: Date | string | null | undefined,
  format: keyof typeof DATE_FORMATS = 'date',
): string => {
  if (!date) return '-';
  return dayjs(date).format(DATE_FORMATS[format]);
};

// Note: VALIDATION_MESSAGES moved to i18n (common-ui.validation namespace)
