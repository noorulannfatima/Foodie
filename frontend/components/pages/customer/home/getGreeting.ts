import type { CustomerStringKey } from '@/constants/customerStrings';

export function getGreeting(t: (key: CustomerStringKey) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('goodMorning');
  if (hour < 17) return t('goodAfternoon');
  return t('goodEvening');
}
