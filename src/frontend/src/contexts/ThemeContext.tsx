/**
 * ThemeContext
 * Provides theme state and controls to entire app
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import type { ThemeConfig } from 'antd';
import { theme as lightTheme, darkTheme } from '@/theme';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ActualTheme = 'light' | 'dark';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  actualTheme: ActualTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  theme: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme-mode';

/**
 * Get system theme preference
 */
function getSystemTheme(): ActualTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Get initial theme mode from localStorage
 */
function getInitialThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'auto'; // Default to auto
}

/**
 * Get actual theme based on mode and system preference
 */
function getActualTheme(mode: ThemeMode, systemTheme: ActualTheme): ActualTheme {
  if (mode === 'auto') {
    return systemTheme;
  }
  return mode;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component
 * Wraps app and provides theme context
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode);
  const [systemTheme, setSystemTheme] = useState<ActualTheme>(getSystemTheme);

  // Calculate actual theme
  const actualTheme = useMemo(
    () => getActualTheme(themeMode, systemTheme),
    [themeMode, systemTheme]
  );

  // Persist theme mode to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  // Update body data-theme attribute
  useEffect(() => {
    document.body.setAttribute('data-theme', actualTheme);
  }, [actualTheme]);

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle theme mode: light → dark → auto → light
  const toggleTheme = useCallback(() => {
    setThemeModeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  }, []);

  // Set theme mode explicitly
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  // Get theme config
  const theme = useMemo<ThemeConfig>(() => {
    return actualTheme === 'dark' ? darkTheme : lightTheme;
  }, [actualTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      actualTheme,
      isDark: actualTheme === 'dark',
      toggleTheme,
      setThemeMode,
      theme,
    }),
    [themeMode, actualTheme, toggleTheme, setThemeMode, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
