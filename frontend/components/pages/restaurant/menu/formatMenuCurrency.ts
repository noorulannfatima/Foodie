import { formatCurrency } from '@/utils/currency';

export function formatMenuCurrency(amount: number): string {
  return formatCurrency(amount);
}
