import { formatCurrency } from '@/utils/currency';

export function formatProfileCurrency(amount: number): string {
  return formatCurrency(amount);
}
