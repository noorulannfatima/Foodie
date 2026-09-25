/**
 * Push notifications via Expo's push service (free, no monthly cap).
 *
 * Expo forwards each message to FCM (Android) or APNs (iOS). We call the HTTP
 * API directly instead of using `expo-server-sdk`, whose current releases are
 * ESM-only and don't load in this CommonJS backend.
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
import mongoose from 'mongoose';
import Restaurant, { normalizeNotificationPreferences } from '../models/restaurant';
import User, { CustomerLanguage, normalizeCustomerLanguage } from '../models/user';

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
 * Sends one message to each token, returning the tokens Expo reports as no
 * longer registered (app uninstalled or token expired) so the caller can drop them.
 */
async function deliverPush(
  tokens: string[],
  message: PushMessage,
  category: string,
  channelId: string
): Promise<string[]> {
  const valid = tokens.filter(isExpoPushToken);
  const staleTokens: string[] = [];

  for (let i = 0; i < valid.length; i += EXPO_BATCH_SIZE) {
    const batch = valid.slice(i, i + EXPO_BATCH_SIZE);
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

  return staleTokens;
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
    const staleTokens = await deliverPush(restaurant.pushTokens, message, category, channelId);

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

/** Preference keys (under User.preferences.notifications) that gate a customer push. */
export type CustomerPushCategory = 'orderUpdates' | 'promotions';

/**
 * Sends a push to every device a customer is signed in on, if they have push
 * and this category switched on. `build` receives the customer's app language
 * so the text matches the app. Never throws.
 */
export async function notifyCustomer(
  customerId: unknown,
  category: CustomerPushCategory,
  build: (language: CustomerLanguage) => PushMessage
): Promise<void> {
  try {
    const customer = await User.findById(customerId)
      .select('+pushTokens preferences.notifications preferences.language')
      .lean();
    if (!customer?.pushTokens?.length) return;

    const prefs = customer.preferences?.notifications;
    // Missing values fall back to the schema defaults (on)
    if (prefs?.push === false || prefs?.[category] === false) return;

    const message = build(normalizeCustomerLanguage(customer.preferences?.language));
    const staleTokens = await deliverPush(
      customer.pushTokens,
      message,
      category,
      ANDROID_CHANNELS.default
    );

    if (staleTokens.length) {
      await User.updateOne({ _id: customer._id }, { $pull: { pushTokens: { $in: staleTokens } } });
    }
  } catch (error) {
    console.error(`Customer push notification (${category}) failed:`, error);
  }
}

const MAX_PUSH_TOKENS_PER_ACCOUNT = 10;
const PUSH_TOKEN_OWNERS = { restaurant: Restaurant, customer: User } as const;
export type PushTokenOwner = keyof typeof PUSH_TOKEN_OWNERS;

/**
 * Attaches a device's push token to an account. A device belongs to whoever
 * signed in last on it, so the token is first removed from every other account
 * of any role. Returns false if the account doesn't exist.
 */
export async function claimPushToken(owner: PushTokenOwner, accountId: string, token: string): Promise<boolean> {
  const others = Object.entries(PUSH_TOKEN_OWNERS) as [PushTokenOwner, mongoose.Model<any>][];
  await Promise.all(
    others.map(([role, Model]) =>
      Model.updateMany(
        role === owner ? { _id: { $ne: accountId }, pushTokens: token } : { pushTokens: token },
        { $pull: { pushTokens: token } }
      )
    )
  );

  // Move the token to the end, keeping only the most recent devices
  const Model: mongoose.Model<any> = PUSH_TOKEN_OWNERS[owner];
  await Model.updateOne({ _id: accountId }, { $pull: { pushTokens: token } });
  const result = await Model.updateOne(
    { _id: accountId },
    { $push: { pushTokens: { $each: [token], $slice: -MAX_PUSH_TOKENS_PER_ACCOUNT } } }
  );
  return result.matchedCount > 0;
}

export async function releasePushToken(owner: PushTokenOwner, accountId: string, token: string): Promise<void> {
  const Model: mongoose.Model<any> = PUSH_TOKEN_OWNERS[owner];
  await Model.updateOne({ _id: accountId }, { $pull: { pushTokens: token } });
}
