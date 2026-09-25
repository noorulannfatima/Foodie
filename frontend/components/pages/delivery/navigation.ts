import { Platform } from 'react-native';

/** Exact coordinates when the order has them, otherwise the address text. */
export type NavigationTarget = { latitude: number; longitude: number; label?: string } | string;

/** Coordinates if both are real numbers, else the fallback address. */
export function navigationTarget(
  coords: { latitude?: number; longitude?: number } | undefined,
  address: string,
  label?: string,
): NavigationTarget {
  const { latitude, longitude } = coords ?? {};
  return typeof latitude === 'number' && typeof longitude === 'number'
    ? { latitude, longitude, label }
    : address;
}

/** A maps URL that starts directions to the target in the platform's maps app. */
export function buildNavigationUrl(target: NavigationTarget, os: string = Platform.OS): string {
  if (typeof target === 'string') {
    const q = encodeURIComponent(target);
    if (os === 'ios') return `maps:0,0?q=${q}`;
    if (os === 'android') return `geo:0,0?q=${q}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  const ll = `${target.latitude},${target.longitude}`;
  if (os === 'ios') return `maps:?daddr=${ll}`;
  if (os === 'android') {
    const label = target.label ? `(${encodeURIComponent(target.label)})` : '';
    return `geo:${ll}?q=${ll}${label}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${ll}`;
}
