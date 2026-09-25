import type { RestaurantProfile } from '@/stores/restaurantStore';
import type { RestaurantStringKey } from '@/constants/restaurantStrings';

export type HoursGroup = { labelKey: RestaurantStringKey; open: string; close: string; isClosed: boolean };

/** Condensed rows (Mon–Thu, Fri–Sat, Sunday) using representative days from the API */
export function getDisplayOperatingHours(profile: RestaurantProfile): HoursGroup[] {
  const hours = profile.operatingHours;
  const mon = hours.monday;
  const fri = hours.friday;
  const sun = hours.sunday;
  return [
    { labelKey: 'profileHoursMonThu', open: mon.open, close: mon.close, isClosed: mon.isClosed },
    { labelKey: 'profileHoursFriSat', open: fri.open, close: fri.close, isClosed: fri.isClosed },
    { labelKey: 'profileDaySunday', open: sun.open, close: sun.close, isClosed: sun.isClosed },
  ];
}
