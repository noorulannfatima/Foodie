/**
 * Push notifications via Expo's push service (free, no monthly cap).
 *
 * Expo forwards each message to FCM (Android) or APNs (iOS). We call the HTTP
 * API directly instead of using `expo-server-sdk`, whose current releases are
 * ESM-only and don't load in this CommonJS backend.
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
import Restaurant, { normalizeNotificationPreferences } from '../models/restaurant';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100; // Expo's per-request limit
const REQUEST_TIMEOUT_MS = 10_000;

/** Must match the Android channel ids created in the app (frontend/services/pushNotifications.ts). */
export const ANDROID_CHANNELS = {
  orders: 'orders',
  default: 'default',
} as const;

/** Preference keys that gate a restaurant push. */
export type RestaurantPushCategory = 'newOrders' | 'orderCancellations' | 'reviews' | 'payouts';

export interface PushMessage {
  title: string;
  body: string;
  /** Delivered to the app; used to decide where tapping the notification navigates. */
  data?: Record<string, unknown>;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[.+\]$/.test(token);
}

async function sendToExpo(messages: object[]): Promise<ExpoPushTicket[]> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  // Only needed if "Enhanced push security" is enabled on the Expo project
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const json = (await res.json()) as { data?: ExpoPushTicket[]; errors?: unknown };
  if (!res.ok || !Array.isArray(json.data)) {
    throw new Error(`Expo push request failed (${res.status}): ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

/**
 * Sends a push to every device a restaurant is signed in on, if the restaurant
 * has both the push channel and this category switched on.
 *
 * Never throws: a failed notification must not fail the request that caused it,
 * so callers can fire and forget.
 */
export async function notifyRestaurant(
  restaurantId: unknown,
  category: RestaurantPushCategory,
  message: PushMessage
): Promise<void> {
  try {
    const restaurant = await Restaurant.findById(restaurantId)
      .select('+pushTokens notificationPreferences')
      .lean();
    if (!restaurant?.pushTokens?.length) return;

    const prefs = normalizeNotificationPreferences(restaurant.notificationPreferences);
    if (!prefs.push || !prefs[category]) return;

    const channelId = category === 'newOrders' ? ANDROID_CHANNELS.orders : ANDROID_CHANNELS.default;
    const tokens = restaurant.pushTokens.filter(isExpoPushToken);
    const staleTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
      const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
      const tickets = await sendToExpo(
        batch.map((to) => ({
          to,
          title: message.title,
          body: message.body,
          data: { ...message.data, category },
          sound: 'default',
          priority: 'high',
          channelId,
        }))
      );

      tickets.forEach((ticket, index) => {
        if (ticket.status !== 'error') return;
        if (ticket.details?.error === 'DeviceNotRegistered') {
          staleTokens.push(batch[index]);
        } else {
          console.warn('Push ticket error:', ticket.details?.error ?? ticket.message);
        }
      });
    }

    // The app was uninstalled or the token expired; stop sending to it
    if (staleTokens.length) {
      await Restaurant.updateOne(
        { _id: restaurant._id },
        { $pull: { pushTokens: { $in: staleTokens } } }
      );
    }
  } catch (error) {
    console.error(`Push notification (${category}) failed:`, error);
  }
}
