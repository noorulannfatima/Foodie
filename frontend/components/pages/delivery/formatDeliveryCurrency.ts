import { formatCurrency } from '@/utils/currency';

export function formatDeliveryCurrency(amount: number): string {
  return formatCurrency(amount);
}
