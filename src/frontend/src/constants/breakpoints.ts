/**
 * Breakpoint Constants
 * Chuẩn hóa breakpoints cho responsive design
 * Theo Ant Design breakpoints
 */

export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Media query helpers
 */
export const mediaQueries = {
  xs: `@media (max-width: ${BREAKPOINTS.xs}px)`,
  sm: `@media (min-width: ${BREAKPOINTS.sm}px)`,
  md: `@media (min-width: ${BREAKPOINTS.md}px)`,
  lg: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  xl: `@media (min-width: ${BREAKPOINTS.xl}px)`,
  xxl: `@media (min-width: ${BREAKPOINTS.xxl}px)`,
  
  // Max width queries
  maxXs: `@media (max-width: ${BREAKPOINTS.xs - 1}px)`,
  maxSm: `@media (max-width: ${BREAKPOINTS.sm - 1}px)`,
  maxMd: `@media (max-width: ${BREAKPOINTS.md - 1}px)`,
  maxLg: `@media (max-width: ${BREAKPOINTS.lg - 1}px)`,
  maxXl: `@media (max-width: ${BREAKPOINTS.xl - 1}px)`,
  maxXxl: `@media (max-width: ${BREAKPOINTS.xxl - 1}px)`,
} as const;

/**
 * Device type helpers
 */
export const DEVICE_TYPES = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
} as const;

export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];
