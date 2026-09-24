import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

// Mirrors RESTAURANT_NOTIFICATION_KEYS on backend/src/models/restaurant.ts — keep both in sync.
export type NotificationPreferenceKey =
  | 'push'
  | 'email'
  | 'sms'
  | 'newOrders'
  | 'orderCancellations'
  | 'reviews'
  | 'payouts'
  | 'weeklySummary'
  | 'marketing';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push: true,
  email: true,
  sms: false,
  newOrders: true,
  orderCancellations: true,
  reviews: true,
  payouts: true,
  weeklySummary: true,
  marketing: false,
};

export interface NotificationPreferenceRow {
  key: NotificationPreferenceKey;
  label: string;
  hint: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const NOTIFICATION_PREFERENCE_SECTIONS: ReadonlyArray<{
  title: string;
  description: string;
  rows: ReadonlyArray<NotificationPreferenceRow>;
}> = [
  {
    title: 'Order alerts',
    description: 'Stay on top of the kitchen pipeline',
    rows: [
      {
        key: 'newOrders',
        label: 'New orders',
        hint: 'Alert me the moment a customer places an order',
        icon: 'receipt-outline',
      },
      {
        key: 'orderCancellations',
        label: 'Cancellations',
        hint: 'When a customer or rider cancels an order',
        icon: 'close-circle-outline',
      },
    ],
  },
  {
    title: 'Business',
    description: 'Feedback and money matters',
    rows: [
      {
        key: 'reviews',
        label: 'Reviews & ratings',
        hint: 'When customers leave a new review',
        icon: 'star-outline',
      },
      {
        key: 'payouts',
        label: 'Payouts',
        hint: 'Payout confirmations and billing notices',
        icon: 'wallet-outline',
      },
      {
        key: 'weeklySummary',
        label: 'Weekly summary',
        hint: 'Orders, revenue and ratings recap every Monday',
        icon: 'stats-chart-outline',
      },
      {
        key: 'marketing',
        label: 'Tips & promotions',
        hint: 'Growth tips and Foodie promotional campaigns',
        icon: 'megaphone-outline',
      },
    ],
  },
  {
    title: 'Delivery channels',
    description: 'Where we reach you',
    rows: [
      {
        key: 'push',
        label: 'Push notifications',
        hint: 'On this device',
        icon: 'phone-portrait-outline',
      },
      {
        key: 'email',
        label: 'Email',
        hint: 'Sent to your restaurant account email',
        icon: 'mail-outline',
      },
      {
        key: 'sms',
        label: 'SMS',
        hint: 'Text messages to your restaurant phone',
        icon: 'chatbubble-outline',
      },
    ],
  },
];

export const NOTIFICATION_CHANNEL_KEYS: ReadonlyArray<NotificationPreferenceKey> = ['push', 'email', 'sms'];

/** Fills keys missing from older restaurant records with their defaults. */
export function withNotificationDefaults(
  prefs?: Partial<NotificationPreferences> | null,
): NotificationPreferences {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(prefs ?? {}) };
}
