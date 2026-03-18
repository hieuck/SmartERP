/**
 * Hook để detect responsive breakpoints
 */

import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screens: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', boolean>>;
}

export function useResponsive(): ResponsiveInfo {
  const screens = useBreakpoint();

  const isMobile = !screens.md; // < 768px
  const isTablet = !!screens.md && !screens.lg; // 768px - 991px
  const isDesktop = !!screens.lg; // >= 992px

  return {
    isMobile,
    isTablet,
    isDesktop,
    screens,
  };
}
