const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? 'Jan';
}

export function getMonthNumber(name: string): number {
  const idx = MONTH_NAMES.indexOf(name);
  return idx >= 0 ? idx + 1 : 1;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

export function toISODate(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0]!;
}

export function deriveMonth(dateStr: string): string {
  return MONTH_NAMES[new Date(dateStr).getMonth()]!;
}

export function deriveYear(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
