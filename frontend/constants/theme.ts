import { useMemo } from 'react';
import { useAppThemeStore } from '@/stores/appThemeStore';

/** The one brand red for buttons and accents across the app (customer, restaurant, delivery). */
export const BRAND_RED = '#7d0606';
/** Pale wash of BRAND_RED for selected/soft backgrounds. */
export const BRAND_RED_TINT = '#F6E7E7';
/**
 * BRAND_RED lifted for text and icons on dark surfaces. The fill red stays BRAND_RED in
 * both themes; this only exists because #7d0606 text on a dark page is ~1.9:1 (unreadable).
 */
export const BRAND_RED_ON_DARK = '#E26464';

/** Soft tile/badge background from a hue: pastel in light mode, translucent wash in dark. */
export function tintBg(hex: string, lightBg: string, isDark: boolean) {
  return isDark ? `${hex}2E` : lightBg;
}

export const Fonts = {
  brand: 'Nunito',
  brandBold: 'Nunito_700Bold',
  brandBlack: 'Nunito_900Black',
};

/** Legacy light palette — prefer useAppThemeColors() in screens that support dark mode. */
export const Colors = {
  background: '#fff',
  text: '#090801',
  primary: BRAND_RED,
  secondary: BRAND_RED,
  dark: '#000000',
  light: '#e6e6e6',
  primaryLight: '#E9F9FF',
  muted: '#666',
};

/** Full palette used across customer, restaurant, and shared UI (light + dark). */
export interface AppColors {
  background: string;
  text: string;
  /** Brand red for fills (buttons, active pills, switches). Same in both themes. */
  brand: string;
  /** Brand red for text, icons and outlines; lifted in dark mode for contrast. */
  primary: string;
  secondary: string;
  dark: string;
  light: string;
  primaryLight: string;
  muted: string;
  screenBackground: string;
  card: string;
  border: string;
  navBar: string;
  customerBodyBg: string;
  customerSurface: string;
  customerNeutral: string;
  customerTextPrimary: string;
  customerTextSecondary: string;
  customerTextMuted: string;
  customerBorder: string;
  customerSecondary: string;
  customerTertiary: string;
  isDark: boolean;
  /** Dark chrome (nav / tab bars); use instead of `dark` when the old `Colors.dark` was a background. */
  chromeDark: string;
}

/**
 * Resolve semantic colors for the current mode. Used by useAppThemeColors and layout backgrounds.
 */
export function getAppColors(isDark: boolean): AppColors {
  if (!isDark) {
    return {
      background: '#fff',
      text: '#090801',
      brand: BRAND_RED,
      primary: BRAND_RED,
      secondary: BRAND_RED,
      dark: '#000000',
      light: '#e6e6e6',
      primaryLight: '#E9F9FF',
      muted: '#666',
      screenBackground: '#F8F9FA',
      card: '#FFFFFF',
      border: '#E5E5E5',
      navBar: '#003049',
      customerBodyBg: '#EEF4FB',
      customerSurface: '#FFFFFF',
      customerNeutral: '#003049',
      customerTextPrimary: '#003049',
      customerTextSecondary: '#5A7184',
      customerTextMuted: '#94A3B8',
      customerBorder: '#E2E8F0',
      customerSecondary: '#F77F00',
      customerTertiary: '#FCBF49',
      isDark: false,
      chromeDark: '#000000',
    };
  }
  return {
    background: '#0F1419',
    text: '#F4F4F5',
    brand: BRAND_RED,
    primary: BRAND_RED_ON_DARK,
    secondary: BRAND_RED,
    dark: '#F4F4F5',
    light: '#27272A',
    primaryLight: '#3D2525',
    muted: '#A1A1AA',
    screenBackground: '#0B1020',
    card: '#161D2E',
    border: '#2D3748',
    navBar: '#0B1526',
    customerBodyBg: '#0B1020',
    customerSurface: '#161D2E',
    customerNeutral: '#0B1526',
    customerTextPrimary: '#F4F4F5',
    customerTextSecondary: '#A1A1AA',
    customerTextMuted: '#71717A',
    customerBorder: '#2D3748',
    customerSecondary: '#F77F00',
    customerTertiary: '#FCBF49',
    isDark: true,
    chromeDark: '#0B1526',
  };
}

/**
 * Subscribe to global dark/light preference (Zustand) and return the active palette.
 * Use in functional components instead of static `Colors` when theme should react to toggles.
 */
export function useAppThemeColors(): AppColors {
  const isDark = useAppThemeStore((s) => s.isDark);
  return useMemo(() => getAppColors(isDark), [isDark]);
}
