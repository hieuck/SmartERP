// Country enums (ISO 3166-1 alpha-2 codes)

export enum Country {
  // Vietnam
  VN = 'VN',
  
  // United States
  US = 'US',
  
  // United Kingdom
  GB = 'GB',
  
  // Japan
  JP = 'JP',
  
  // South Korea
  KR = 'KR',
  
  // China
  CN = 'CN',
  
  // Taiwan
  TW = 'TW',
  
  // Hong Kong
  HK = 'HK',
  
  // Singapore
  SG = 'SG',
  
  // Thailand
  TH = 'TH',
  
  // Malaysia
  MY = 'MY',
  
  // Indonesia
  ID = 'ID',
  
  // Philippines
  PH = 'PH',
  
  // Australia
  AU = 'AU',
  
  // Canada
  CA = 'CA',
  
  // France
  FR = 'FR',
  
  // Germany
  DE = 'DE',
  
  // Spain
  ES = 'ES',
  
  // Italy
  IT = 'IT',
  
  // Netherlands
  NL = 'NL',
  
  // Switzerland
  CH = 'CH',
  
  // India
  IN = 'IN',
  
  // Brazil
  BR = 'BR',
  
  // Mexico
  MX = 'MX',
}

export const CountryName: Record<Country, string> = {
  [Country.VN]: 'Vietnam',
  [Country.US]: 'United States',
  [Country.GB]: 'United Kingdom',
  [Country.JP]: 'Japan',
  [Country.KR]: 'South Korea',
  [Country.CN]: 'China',
  [Country.TW]: 'Taiwan',
  [Country.HK]: 'Hong Kong',
  [Country.SG]: 'Singapore',
  [Country.TH]: 'Thailand',
  [Country.MY]: 'Malaysia',
  [Country.ID]: 'Indonesia',
  [Country.PH]: 'Philippines',
  [Country.AU]: 'Australia',
  [Country.CA]: 'Canada',
  [Country.FR]: 'France',
  [Country.DE]: 'Germany',
  [Country.ES]: 'Spain',
  [Country.IT]: 'Italy',
  [Country.NL]: 'Netherlands',
  [Country.CH]: 'Switzerland',
  [Country.IN]: 'India',
  [Country.BR]: 'Brazil',
  [Country.MX]: 'Mexico',
};

export const CountryDialCode: Record<Country, string> = {
  [Country.VN]: '+84',
  [Country.US]: '+1',
  [Country.GB]: '+44',
  [Country.JP]: '+81',
  [Country.KR]: '+82',
  [Country.CN]: '+86',
  [Country.TW]: '+886',
  [Country.HK]: '+852',
  [Country.SG]: '+65',
  [Country.TH]: '+66',
  [Country.MY]: '+60',
  [Country.ID]: '+62',
  [Country.PH]: '+63',
  [Country.AU]: '+61',
  [Country.CA]: '+1',
  [Country.FR]: '+33',
  [Country.DE]: '+49',
  [Country.ES]: '+34',
  [Country.IT]: '+39',
  [Country.NL]: '+31',
  [Country.CH]: '+41',
  [Country.IN]: '+91',
  [Country.BR]: '+55',
  [Country.MX]: '+52',
};
