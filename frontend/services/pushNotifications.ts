import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { restaurantAPI } from '@/services/api/restaurant.api';
import { customerAPI } from '@/services/api/customer.api';

/** Remembers which account this device's token was registered to, so sign out can release it. */
const PUSH_REGISTRATION_KEY = 'pushRegistration';
/** Pre-customer-push key; still read so older installs unregister cleanly. */
const LEGACY_RESTAURANT_TOKEN_KEY = 'restaurantPushToken';

type PushRole = 'restaurant' | 'customer';

const PUSH_APIS: Record<PushRole, { register: (t: string) => Promise<unknown>; unregister: (t: string) => Promise<unknown> }> = {
  restaurant: {
    register: (t) => restaurantAPI.registerPushToken(t),
    unregister: (t) => restaurantAPI.unregisterPushToken(t),
  },
  customer: {
    register: (t) => customerAPI.registerPushToken(t),
    unregister: (t) => customerAPI.unregisterPushToken(t),
  },
};
const UNREGISTER_TIMEOUT_MS = 3000;

/** Must match ANDROID_CHANNELS in backend/src/services/push.service.ts. */
const ANDROID_CHANNELS = {
  orders: 'orders',
  default: 'default',
} as const;

export type RestaurantPushType = 'new_order' | 'order_cancelled' | 'new_review' | 'payout';
export type CustomerPushType = 'order_status';

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
 * signed-in account. Safe to call on every launch; it never throws.
 */
async function registerPushNotifications(role: PushRole): Promise<void> {
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
    await PUSH_APIS[role].register(token);
    await AsyncStorage.setItem(PUSH_REGISTRATION_KEY, JSON.stringify({ token, role }));
  } catch (error) {
    console.warn('[push] Registration failed:', error);
  }
}

export const registerRestaurantPushNotifications = () => registerPushNotifications('restaurant');
export const registerCustomerPushNotifications = () => registerPushNotifications('customer');

async function readRegistration(): Promise<{ token: string; role: PushRole } | null> {
  const saved = await AsyncStorage.getItem(PUSH_REGISTRATION_KEY);
  if (saved) return JSON.parse(saved);
  const legacy = await AsyncStorage.getItem(LEGACY_RESTAURANT_TOKEN_KEY);
  return legacy ? { token: legacy, role: 'restaurant' } : null;
}

/**
 * Detaches this device from the signed-in account so it stops receiving pushes.
 * Must run while the auth token is still stored. Never throws, and gives up
 * after a few seconds so a slow network can't hold up sign out.
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const registration = await readRegistration();
    if (!registration) return;
    await AsyncStorage.multiRemove([PUSH_REGISTRATION_KEY, LEGACY_RESTAURANT_TOKEN_KEY]);
    await Promise.race([
      PUSH_APIS[registration.role].unregister(registration.token),
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
      return '/(restaurant)/reviews' as const;
    case 'payout':
      return '/(restaurant)/(tabs)/profile' as const;
    default:
      return null;
  }
}

/** Where tapping a customer notification should take the user. */
export function getCustomerPushRoute(data: unknown) {
  const { type, orderId } = (data ?? {}) as { type?: CustomerPushType; orderId?: string };
  if (type === 'order_status' && orderId) return `/(customer)/order/${orderId}` as const;
  return null;
}
