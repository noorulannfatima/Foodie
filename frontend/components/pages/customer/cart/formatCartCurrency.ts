import { formatCurrency } from '@/utils/currency';

export function formatCartCurrency(amount: number): string {
  return formatCurrency(amount);
}
