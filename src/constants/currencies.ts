export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  TTD: { code: 'TTD', symbol: '$', name: 'Trinidad & Tobago Dollar', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  JMD: { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', decimals: 2 },
  BBD: { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar', decimals: 2 },
  XCD: { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar', decimals: 2 },
};

export const DEFAULT_CURRENCY = 'TTD';

export const CURRENCY_LIST = Object.values(CURRENCIES);
