import type { RestaurantT } from '@/constants/restaurantStrings';

export function getDashboardGreeting(t: RestaurantT): string {
  const h = new Date().getHours();
  if (h < 12) return t('dashGoodMorning');
  if (h < 17) return t('dashGoodAfternoon');
  return t('dashGoodEvening');
}
