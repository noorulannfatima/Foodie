import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dev API origin shared by Axios and fetch-based clients.
 * Prefers Metro host (works on physical devices on LAN); falls back to emulator defaults.
 */
export function getApiBaseUrl(): string {
  const hostFromExpo = Constants.expoConfig?.hostUri?.split(':')[0];
  if (hostFromExpo) {
    return `http://${hostFromExpo}:5000`;
  }
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:5000`;
}

export const API_BASE_URL = getApiBaseUrl();
