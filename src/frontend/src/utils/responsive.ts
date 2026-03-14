/**
 * Responsive Utilities
 * Helper functions for responsive design
 */

import { SPACING_PATTERNS, TYPOGRAPHY } from '@/constants/design-tokens';
import { ResponsiveInfo } from '@/hooks/useResponsive';

/**
 * Get responsive value based on device type
 */
export const getResponsiveValue = <T>(
  responsive: ResponsiveInfo,
  values: { mobile: T; tablet: T; desktop: T },
): T => {
  if (responsive.isMobile) return values.mobile;
  if (responsive.isTablet) return values.tablet;
  return values.desktop;
};

/**
 * Get responsive spacing
 */
export const getSpacing = (
  responsive: ResponsiveInfo,
  pattern: keyof typeof SPACING_PATTERNS,
): number => {
  return getResponsiveValue(responsive, SPACING_PATTERNS[pattern]);
};

/**
 * Get responsive font size
 */
export const getFontSize = (
  responsive: ResponsiveInfo,
  variant: keyof typeof TYPOGRAPHY,
): number => {
  return getResponsiveValue(responsive, TYPOGRAPHY[variant]);
};

/**
 * Get responsive gutter for Ant Design Grid
 */
export const getGutter = (responsive: ResponsiveInfo): [number, number] => {
  const size = getSpacing(responsive, 'gutter');
  return [size, size];
};

/**
 * Get responsive card size
 */
export const getCardSize = (responsive: ResponsiveInfo): 'small' | 'default' => {
  return responsive.isMobile ? 'small' : 'default';
};

/**
 * Get responsive button size
 */
export const getButtonSize = (responsive: ResponsiveInfo): 'small' | 'middle' | 'large' => {
  return responsive.isMobile ? 'middle' : 'middle';
};

/**
 * Get responsive table size
 */
export const getTableSize = (responsive: ResponsiveInfo): 'small' | 'middle' | 'large' => {
  return responsive.isMobile ? 'small' : 'middle';
};

/**
 * Get responsive pagination config
 */
export const getPaginationConfig = (responsive: ResponsiveInfo) => ({
  simple: responsive.isMobile,
  showSizeChanger: !responsive.isMobile,
  size: responsive.isMobile ? ('small' as const) : ('default' as const),
});

/**
 * Format currency based on locale
 */
export const formatCurrency = (value: number, locale: string = 'vi'): string => {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: locale === 'vi' ? 'VND' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date to DD/MM/YYYY
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format number based on locale
 */
export const formatNumber = (value: number, locale: string = 'vi'): string => {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value);
};

/**
 * Get responsive column span for forms
 */
export const getFormColumnSpan = (responsive: ResponsiveInfo) => ({
  xs: 24,
  sm: 24,
  md: responsive.isDesktop ? 12 : 24,
  lg: responsive.isDesktop ? 12 : 24,
});

/**
 * Get responsive modal width
 */
export const getModalWidth = (responsive: ResponsiveInfo): number | string => {
  if (responsive.isMobile) return '100%';
  if (responsive.isTablet) return 600;
  return 800;
};
