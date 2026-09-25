import type { RestaurantStringKey, RestaurantT } from '@/constants/restaurantStrings';
import { orderStatusLabel } from '@/constants/restaurantStrings';

export const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed'] as const;

/** Display label for a STATUS_FILTERS value (the value itself stays English for logic). */
export function statusFilterLabel(filter: string, t: RestaurantT): string {
  if (filter === 'All') return t('ordersFilterAll');
  if (filter === 'Completed') return t('ordersCompleted');
  return orderStatusLabel(filter, t);
}

export const NEXT_STATUS: Record<string, { labelKey: RestaurantStringKey; status: string }> = {
  Pending: { labelKey: 'ordersAccept', status: 'Confirmed' },
  Confirmed: { labelKey: 'ordersStartPreparing', status: 'Preparing' },
  Preparing: { labelKey: 'ordersMarkReady', status: 'Ready' },
};
