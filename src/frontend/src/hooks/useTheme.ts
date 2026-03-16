/**
 * useTheme Hook
 * Hook for managing theme mode (light/dark) and responsive theme
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ThemeConfig } from 'antd';
import { theme as lightTheme, darkTheme } from '@/theme';

export type ThemeMode = 'light' | 'dark';
export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export interface UseThemeReturn {
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
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
  mobile: 576,
  tablet: 768,
  desktop: 768,
} as const;

/**
 * Local storage key for theme preference
 */
const THEME_STORAGE_KEY = 'theme-mode';

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
 * Get responsive theme tokens based on screen size
 */
function getResponsiveTokens(screenSize: ScreenSize) {
  const tokens = {
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

  return tokens[screenSize];
}

/**
 * Get theme config based on mode and screen size
 */
function getThemeConfig(themeMode: ThemeMode, screenSize: ScreenSize): ThemeConfig {
  const baseTheme = themeMode === 'dark' ? darkTheme : lightTheme;
  const responsiveTokens = getResponsiveTokens(screenSize);

  return {
    ...baseTheme,
    token: {
      ...baseTheme.token,
      ...responsiveTokens,
    },
  };
}

/**
 * Get initial theme mode from localStorage or system preference
 */
function getInitialThemeMode(): ThemeMode {
  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  return 'light';
}

/**
 * Hook for managing theme (dark/light mode + responsive)
 * 
 * @returns {UseThemeReturn} Theme management functions and state
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { themeMode, isDark, toggleTheme, theme } = useTheme();
 *   
 *   return (
 *     <ConfigProvider theme={theme}>
 *       <Button onClick={toggleTheme}>
 *         {isDark ? 'Light Mode' : 'Dark Mode'}
 *       </Button>
 *     </ConfigProvider>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Theme mode state
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode);

  // Screen size state
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getScreenSize(window.innerWidth);
  });

  // Persist theme mode to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  // Handle window resize for responsive theme
  useEffect(() => {
    const handleResize = () => {
      const newScreenSize = getScreenSize(window.innerWidth);
      if (newScreenSize !== screenSize) {
        setScreenSize(newScreenSize);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [screenSize]);

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeModeState(e.matches ? 'dark' : 'light');
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Toggle theme mode
  const toggleTheme = useCallback(() => {
    setThemeModeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Set theme mode explicitly
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  // Get combined theme config (mode + responsive)
  const theme = useMemo(
    () => getThemeConfig(themeMode, screenSize),
    [themeMode, screenSize]
  );

  return {
    themeMode,
    isDark: themeMode === 'dark',
    toggleTheme,
    setThemeMode,
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    theme,
  };
}

export default useTheme;
