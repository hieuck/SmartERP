import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getButtonSize,
  getCardSize,
  getFormColumnSpan,
  getGutter,
  getPaginationConfig,
  getResponsiveValue,
  getTableSize,
} from './responsive';

const mobile = {
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  screens: { xs: true, sm: false, md: false, lg: false, xl: false, xxl: false },
};

const desktop = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screens: { xs: false, sm: false, md: true, lg: true, xl: false, xxl: false },
};

describe('responsive utilities', () => {
  it('selects values by device type and derives sizing helpers', () => {
    expect(
      getResponsiveValue(mobile, { mobile: 'm', tablet: 't', desktop: 'd' }),
    ).toBe('m');
    expect(
      getResponsiveValue(desktop, { mobile: 'm', tablet: 't', desktop: 'd' }),
    ).toBe('d');
    expect(getCardSize(mobile)).toBe('small');
    expect(getCardSize(desktop)).toBe('medium');
    expect(getButtonSize(mobile)).toBe('middle');
    expect(getTableSize(mobile)).toBe('small');
    expect(getTableSize(desktop)).toBe('middle');
  });

  it('derives responsive layout helpers for gutter, pagination, and form span', () => {
    const mobileGutter = getGutter(mobile);
    const desktopGutter = getGutter(desktop);

    expect(mobileGutter[0]).toBe(mobileGutter[1]);
    expect(desktopGutter[0]).toBe(desktopGutter[1]);
    expect(getPaginationConfig(mobile)).toEqual({
      simple: true,
      showSizeChanger: false,
      size: 'small',
    });
    expect(getPaginationConfig(desktop)).toEqual({
      simple: false,
      showSizeChanger: true,
      size: 'default',
    });
    expect(getFormColumnSpan(mobile)).toEqual({
      xs: 24,
      sm: 24,
      md: 24,
      lg: 24,
    });
    expect(getFormColumnSpan(desktop)).toEqual({
      xs: 24,
      sm: 24,
      md: 12,
      lg: 12,
    });
  });

  it('formats currency, dates, and numbers by locale', () => {
    expect(formatCurrency(1500000, 'vi')).toMatch(/1\.500\.000/);
    expect(formatCurrency(1200, 'en')).toContain('$1,200');
    expect(formatDate('2026-03-19T08:30:00.000Z')).toBe('19/03/2026');
    expect(formatNumber(1234567, 'vi')).toBe('1.234.567');
    expect(formatNumber(1234567, 'en')).toBe('1,234,567');
  });
});
