/**
 * Design Tokens
 * Centralized design system tokens for consistent UI
 */

/**
 * Spacing Scale (4px base unit)
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * Responsive Spacing
 * Returns spacing based on device type
 */
export const getResponsiveSpacing = (
  mobile: number,
  tablet: number,
  desktop: number,
): { mobile: number; tablet: number; desktop: number } => ({
  mobile,
  tablet,
  desktop,
});

/**
 * Common spacing patterns
 */
export const SPACING_PATTERNS = {
  // Page padding
  pagePadding: getResponsiveSpacing(12, 16, 24),
  
  // Card padding
  cardPadding: getResponsiveSpacing(12, 16, 24),
  
  // Section spacing
  sectionSpacing: getResponsiveSpacing(16, 24, 32),
  
  // Gutter (grid spacing)
  gutter: getResponsiveSpacing(8, 12, 16),
} as const;

/**
 * Font Sizes
 */
export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  xxxxl: 38,
} as const;

/**
 * Responsive Font Sizes
 */
export const getResponsiveFontSize = (
  mobile: number,
  tablet: number,
  desktop: number,
): { mobile: number; tablet: number; desktop: number } => ({
  mobile,
  tablet,
  desktop,
});

/**
 * Typography patterns
 */
export const TYPOGRAPHY = {
  h1: getResponsiveFontSize(24, 30, 38),
  h2: getResponsiveFontSize(20, 24, 30),
  h3: getResponsiveFontSize(18, 20, 24),
  h4: getResponsiveFontSize(16, 18, 20),
  h5: getResponsiveFontSize(14, 16, 16),
  body: getResponsiveFontSize(14, 14, 14),
  small: getResponsiveFontSize(12, 12, 12),
  tiny: getResponsiveFontSize(11, 11, 11),
} as const;

/**
 * Border Radius
 */
export const BORDER_RADIUS = {
  xs: 2,
  sm: 4,
  base: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  round: 9999,
} as const;

/**
 * Shadows
 */
export const SHADOWS = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
  base: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

/**
 * Z-Index Scale
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Transitions
 */
export const TRANSITIONS = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Animation Easings
 */
export const EASINGS = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
