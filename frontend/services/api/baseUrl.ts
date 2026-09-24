import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API origin shared by Axios and fetch-based clients.
 * Production builds read EXPO_PUBLIC_API_URL (set per build profile in eas.json).
 * In development, prefers the Metro host (works on physical devices on LAN) and
 * falls back to emulator defaults.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  const hostFromExpo = Constants.expoConfig?.hostUri?.split(':')[0];
  if (hostFromExpo) {
    return `http://${hostFromExpo}:5000`;
  }
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:5000`;
}

export const API_BASE_URL = getApiBaseUrl();
