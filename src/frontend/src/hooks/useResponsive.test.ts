import { renderHook } from '@testing-library/react';
import { useResponsive } from './useResponsive';
import { Grid } from 'antd';
import { vi } from 'vitest';

// Mock Ant Design Grid
vi.mock('antd', () => ({
  Grid: {
    useBreakpoint: vi.fn(),
  },
}));

describe('useResponsive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect mobile screen (xs)', () => {
    (Grid.useBreakpoint as any).mockReturnValue({
      xs: true,
      sm: false,
      md: false,
      lg: false,
      xl: false,
      xxl: false,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screens.xs).toBe(true);
  });

  it('should detect mobile screen (sm)', () => {
    (Grid.useBreakpoint as any).mockReturnValue({
      xs: true,
      sm: true,
      md: false,
      lg: false,
      xl: false,
      xxl: false,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should detect tablet screen (md)', () => {
    (Grid.useBreakpoint as any).mockReturnValue({
      xs: true,
      sm: true,
      md: true,
      lg: false,
      xl: false,
      xxl: false,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screens.md).toBe(true);
  });

  it('should detect desktop screen (lg)', () => {
    (Grid.useBreakpoint as any).mockReturnValue({
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: false,
      xxl: false,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.screens.lg).toBe(true);
  });

  it('should detect large desktop screen (xl)', () => {
    (Grid.useBreakpoint as any).mockReturnValue({
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: true,
      xxl: false,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.screens.xl).toBe(true);
  });

  it('should detect extra large desktop screen (xxl)', () => {
    (Grid.useBreakpoint as any).mockReturnValue({
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: true,
      xxl: true,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.screens.xxl).toBe(true);
  });

  it('should return all screen breakpoints', () => {
    const mockScreens = {
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: false,
      xxl: false,
    };

    (Grid.useBreakpoint as any).mockReturnValue(mockScreens);

    const { result } = renderHook(() => useResponsive());

    expect(result.current.screens).toEqual(mockScreens);
  });
});
