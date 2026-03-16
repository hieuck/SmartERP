/**
 * useResponsiveTheme Hook
 * Hook for managing responsive theme based on screen size
 */

import { useState, useEffect } from 'react';
import type { ThemeConfig } from 'antd';
import { theme as baseTheme } from '@/theme';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export interface UseResponsiveThemeReturn {
  screenSize: ScreenSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  theme: ThemeConfig;
}

/**
 * Breakpoints (matching Ant Design defaults)
 */
const BREAKPOINTS = {
  mobile: 576,   // < 576px
  tablet: 768,   // 576px - 768px
  desktop: 768,  // >= 768px
} as const;

/**
 * Get current screen size based on window width
 */
function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile';
  }
  if (width < BREAKPOINTS.desktop) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Get responsive theme config based on screen size
 */
function getResponsiveTheme(screenSize: ScreenSize): ThemeConfig {
  const responsiveTokens = {
    mobile: {
      fontSize: 14,
      borderRadius: 4,
      controlHeight: 36,
      padding: 12,
      margin: 12,
    },
    tablet: {
      fontSize: 14,
      borderRadius: 6,
      controlHeight: 38,
      padding: 16,
      margin: 16,
    },
    desktop: {
      fontSize: 14,
      borderRadius: 8,
      controlHeight: 40,
      padding: 20,
      margin: 20,
    },
  };

  const tokens = responsiveTokens[screenSize];

  return {
    ...baseTheme,
    token: {
      ...baseTheme.token,
      ...tokens,
    },
  };
}

/**
 * Hook for managing responsive theme
 * 
 * @returns {UseResponsiveThemeReturn} Responsive theme state and config
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { screenSize, isMobile, theme } = useResponsiveTheme();
 *   
 *   return (
 *     <ConfigProvider theme={theme}>
 *       {isMobile ? <MobileLayout /> : <DesktopLayout />}
 *     </ConfigProvider>
 *   );
 * }
 * ```
 */
export function useResponsiveTheme(): UseResponsiveThemeReturn {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getScreenSize(window.innerWidth);
  });

  useEffect(() => {
    // Handle resize
    const handleResize = () => {
      const newScreenSize = getScreenSize(window.innerWidth);
      if (newScreenSize !== screenSize) {
        setScreenSize(newScreenSize);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [screenSize]);

  const theme = getResponsiveTheme(screenSize);

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    theme,
  };
}

export default useResponsiveTheme;
