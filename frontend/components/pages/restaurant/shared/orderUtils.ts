import { formatCurrency } from '@/utils/currency';
import type { RestaurantT } from '@/constants/restaurantStrings';

export function formatRestaurantCurrency(amount: number): string {
  return formatCurrency(amount);
}

export function getOrderTimeAgo(dateStr: string, t: RestaurantT): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return t('minutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('hoursAgo', { count: hrs });
  return t('daysAgo', { count: Math.floor(hrs / 24) });
}
