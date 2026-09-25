import { formatCurrency } from '@/utils/currency';

/** `Rs. 1,234`, or `−Rs. 150` for negatives (restaurant owes Foodie). */
export function formatPKR(amount: number): string {
  return formatCurrency(amount);
}

export function formatShortDate(iso: string, locale = 'en-GB'): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function formatPeriod(start: string, end: string, locale?: string): string {
  return `${formatShortDate(start, locale)} – ${formatShortDate(end, locale)}`;
}

/** Shows the last 4 characters only, e.g. `•••• 7890`. */
export function maskAccountNumber(value?: string): string {
  if (!value) return '—';
  return `•••• ${value.slice(-4)}`;
}

/** `0.15` → `15%`, `0.125` → `12.5%`. */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}
