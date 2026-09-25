import type { RestaurantStringKey, RestaurantT } from '@/constants/restaurantStrings';

export const SPICE_LEVELS = ['Mild', 'Medium', 'Hot', 'Extra Hot'] as const;

const SPICE_LEVEL_KEYS: Record<string, RestaurantStringKey> = {
  Mild: 'menuSpiceMild',
  Medium: 'menuSpiceMedium',
  Hot: 'menuSpiceHot',
  'Extra Hot': 'menuSpiceExtraHot',
};

/** Translated label for a stored spice level; unknown values pass through. */
export function spiceLevelLabel(level: string, t: RestaurantT): string {
  const key = SPICE_LEVEL_KEYS[level];
  return key ? t(key) : level;
}
