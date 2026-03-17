import { formatCurrency } from './currency-formatter';

describe('formatCurrency', () => {
  it('should format positive number with default USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format negative number', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format with VND currency', () => {
    expect(formatCurrency(1234567, 'VND')).toBe('₫1,234,567');
  });

  it('should format with EUR currency', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('should handle decimal places correctly', () => {
    expect(formatCurrency(1234.567)).toBe('$1,234.57');
  });

  it('should throw error for invalid input', () => {
    expect(() => formatCurrency(NaN)).toThrow('Invalid amount');
  });

  it('should throw error for invalid currency code', () => {
    expect(() => formatCurrency(100, 'INVALID')).toThrow('Invalid currency code');
  });
});
