import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies';

export function formatAmount(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = CURRENCIES[currencyCode];
  const symbol = currency?.symbol ?? '$';
  const decimals = currency?.decimals ?? 2;
  const formatted = Math.abs(amount).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function percentOf(part: number, whole: number): number {
  if (whole === 0) return 0;
  return roundMoney((part / whole) * 100);
}
