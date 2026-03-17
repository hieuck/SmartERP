/**
 * Currency formatter utility
 * Formats numbers as currency with proper symbols and formatting
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  VND: '₫',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

const CURRENCY_DECIMALS: Record<string, number> = {
  USD: 2,
  VND: 0,
  EUR: 2,
  GBP: 2,
  JPY: 0,
};

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currencyCode - The currency code (default: USD)
 * @returns Formatted currency string
 * @throws Error if amount is invalid or currency code is not supported
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
): string {
  // Validate amount
  if (isNaN(amount) || !isFinite(amount)) {
    throw new Error('Invalid amount');
  }

  // Validate currency code
  if (!CURRENCY_SYMBOLS[currencyCode]) {
    throw new Error('Invalid currency code');
  }

  const symbol = CURRENCY_SYMBOLS[currencyCode];
  const decimals = CURRENCY_DECIMALS[currencyCode];

  // Handle negative numbers
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  // Format with proper decimals
  const formatted = absoluteAmount.toFixed(decimals);

  // Add thousand separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const result = parts.join('.');

  // Return with symbol and sign
  return isNegative ? `-${symbol}${result}` : `${symbol}${result}`;
}
