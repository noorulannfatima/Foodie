import { useMemo } from 'react';
import { useAppThemeStore } from '@/stores/appThemeStore';

export const Fonts = {
  brand: 'Nunito',
  brandBold: 'Nunito_700Bold',
  brandBlack: 'Nunito_900Black',
};

/** Legacy light palette — prefer useAppThemeColors() in screens that support dark mode. */
export const Colors = {
  background: '#fff',
  text: '#090801',
  primary: '#fa1919',
  secondary: '#7d0606',
  dark: '#000000',
  light: '#e6e6e6',
  primaryLight: '#E9F9FF',
  muted: '#666',
};

/** Full palette used across customer, restaurant, and shared UI (light + dark). */
export interface AppColors {
  background: string;
  text: string;
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
      primary: '#fa1919',
      secondary: '#7d0606',
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
    primary: '#fa1919',
    secondary: '#ff6b6b',
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
