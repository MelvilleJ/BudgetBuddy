import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies';

export function formatAmount(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = CURRENCIES[currencyCode];
  const symbol = currency?.symbol ?? '$';
  const decimals = currency?.decimals ?? 2;
  const formatted = Math.abs(amount).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.symbol ?? '$';
}

export function formatWithCode(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  return `${formatAmount(amount, currencyCode)} ${currencyCode}`;
}
