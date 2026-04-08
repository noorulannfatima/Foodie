import type { RestaurantProfile } from '@/stores/restaurantStore';

export type HoursGroup = { label: string; open: string; close: string; isClosed: boolean };

/** Condensed rows (Mon–Thu, Fri–Sat, Sunday) using representative days from the API */
export function getDisplayOperatingHours(profile: RestaurantProfile): HoursGroup[] {
  const hours = profile.operatingHours;
  const mon = hours.monday;
  const fri = hours.friday;
  const sun = hours.sunday;
  return [
    { label: 'Mon - Thu', open: mon.open, close: mon.close, isClosed: mon.isClosed },
    { label: 'Fri - Sat', open: fri.open, close: fri.close, isClosed: fri.isClosed },
    { label: 'Sunday', open: sun.open, close: sun.close, isClosed: sun.isClosed },
  ];
}
