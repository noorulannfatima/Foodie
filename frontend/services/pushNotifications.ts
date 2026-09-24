import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { restaurantAPI } from '@/services/api/restaurant.api';

const PUSH_TOKEN_KEY = 'restaurantPushToken';
const UNREGISTER_TIMEOUT_MS = 3000;

/** Must match ANDROID_CHANNELS in backend/src/services/push.service.ts. */
const ANDROID_CHANNELS = {
  orders: 'orders',
  default: 'default',
} as const;

export type RestaurantPushType = 'new_order' | 'order_cancelled' | 'new_review';

// Show notifications as banners with sound even while the app is open —
// a new order should never go unnoticed because the app happens to be in front.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.orders, {
    name: 'New orders',
    description: 'Loud alerts for incoming orders',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 400, 250, 400],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.default, {
    name: 'Updates',
    description: 'Cancellations, reviews and other updates',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Asks for permission, gets this device's Expo push token and saves it on the
 * signed-in restaurant. Safe to call on every launch; it never throws.
 */
export async function registerRestaurantPushNotifications(): Promise<void> {
  try {
    await ensureAndroidChannels();

    if (!Device.isDevice) {
      console.info('[push] Skipped: push notifications need a physical device.');
      return;
    }

    const projectId = getProjectId();
    if (!projectId) {
      console.warn('[push] Skipped: no EAS projectId. Run `npx eas init` in frontend/ to create one.');
      return;
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await restaurantAPI.registerPushToken(token);
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch (error) {
    console.warn('[push] Registration failed:', error);
  }
}

/**
 * Detaches this device from the restaurant so it stops receiving pushes.
 * Must run while the auth token is still stored. Never throws, and gives up
 * after a few seconds so a slow network can't hold up sign out.
 */
export async function unregisterRestaurantPushNotifications(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    await Promise.race([
      restaurantAPI.unregisterPushToken(token),
      new Promise((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.warn('[push] Unregister failed:', error);
  }
}

/** Where tapping a restaurant notification should take the user. */
export function getRestaurantPushRoute(data: unknown) {
  const type = (data as { type?: RestaurantPushType } | undefined)?.type;
  switch (type) {
    case 'new_order':
    case 'order_cancelled':
      return '/(restaurant)/(tabs)/orders' as const;
    case 'new_review':
      return '/(restaurant)/(tabs)/dashboard' as const;
    default:
      return null;
  }
}
