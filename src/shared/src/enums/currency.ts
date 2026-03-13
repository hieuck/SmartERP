// Currency enums for multi-currency support

export enum Currency {
  // Vietnamese Dong
  VND = 'VND',
  
  // US Dollar
  USD = 'USD',
  
  // Euro
  EUR = 'EUR',
  
  // British Pound
  GBP = 'GBP',
  
  // Japanese Yen
  JPY = 'JPY',
  
  // Chinese Yuan
  CNY = 'CNY',
  
  // Korean Won
  KRW = 'KRW',
  
  // Singapore Dollar
  SGD = 'SGD',
  
  // Thai Baht
  THB = 'THB',
  
  // Malaysian Ringgit
  MYR = 'MYR',
  
  // Indonesian Rupiah
  IDR = 'IDR',
  
  // Philippine Peso
  PHP = 'PHP',
  
  // Australian Dollar
  AUD = 'AUD',
  
  // Canadian Dollar
  CAD = 'CAD',
  
  // Swiss Franc
  CHF = 'CHF',
}

export const CurrencySymbol: Record<Currency, string> = {
  [Currency.VND]: '₫',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
  [Currency.JPY]: '¥',
  [Currency.CNY]: '¥',
  [Currency.KRW]: '₩',
  [Currency.SGD]: 'S$',
  [Currency.THB]: '฿',
  [Currency.MYR]: 'RM',
  [Currency.IDR]: 'Rp',
  [Currency.PHP]: '₱',
  [Currency.AUD]: 'A$',
  [Currency.CAD]: 'C$',
  [Currency.CHF]: 'CHF',
};

export const CurrencyName: Record<Currency, string> = {
  [Currency.VND]: 'Vietnamese Dong',
  [Currency.USD]: 'US Dollar',
  [Currency.EUR]: 'Euro',
  [Currency.GBP]: 'British Pound',
  [Currency.JPY]: 'Japanese Yen',
  [Currency.CNY]: 'Chinese Yuan',
  [Currency.KRW]: 'Korean Won',
  [Currency.SGD]: 'Singapore Dollar',
  [Currency.THB]: 'Thai Baht',
  [Currency.MYR]: 'Malaysian Ringgit',
  [Currency.IDR]: 'Indonesian Rupiah',
  [Currency.PHP]: 'Philippine Peso',
  [Currency.AUD]: 'Australian Dollar',
  [Currency.CAD]: 'Canadian Dollar',
  [Currency.CHF]: 'Swiss Franc',
};
