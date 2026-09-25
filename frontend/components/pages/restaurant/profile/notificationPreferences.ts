import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { RestaurantStringKey } from '@/constants/restaurantStrings';

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
  labelKey: RestaurantStringKey;
  hintKey: RestaurantStringKey;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const NOTIFICATION_PREFERENCE_SECTIONS: ReadonlyArray<{
  titleKey: RestaurantStringKey;
  descriptionKey: RestaurantStringKey;
  rows: ReadonlyArray<NotificationPreferenceRow>;
}> = [
  {
    titleKey: 'profileNotifOrderAlerts',
    descriptionKey: 'profileNotifOrderAlertsDesc',
    rows: [
      {
        key: 'newOrders',
        labelKey: 'profileNotifNewOrders',
        hintKey: 'profileNotifNewOrdersHint',
        icon: 'receipt-outline',
      },
      {
        key: 'orderCancellations',
        labelKey: 'profileNotifCancellations',
        hintKey: 'profileNotifCancellationsHint',
        icon: 'close-circle-outline',
      },
    ],
  },
  {
    titleKey: 'profileNotifBusiness',
    descriptionKey: 'profileNotifBusinessDesc',
    rows: [
      {
        key: 'reviews',
        labelKey: 'profileNotifReviews',
        hintKey: 'profileNotifReviewsHint',
        icon: 'star-outline',
      },
      {
        key: 'payouts',
        labelKey: 'profileNotifPayouts',
        hintKey: 'profileNotifPayoutsHint',
        icon: 'wallet-outline',
      },
      {
        key: 'weeklySummary',
        labelKey: 'profileNotifWeeklySummary',
        hintKey: 'profileNotifWeeklySummaryHint',
        icon: 'stats-chart-outline',
      },
      {
        key: 'marketing',
        labelKey: 'profileNotifMarketing',
        hintKey: 'profileNotifMarketingHint',
        icon: 'megaphone-outline',
      },
    ],
  },
  {
    titleKey: 'profileNotifChannels',
    descriptionKey: 'profileNotifChannelsDesc',
    rows: [
      {
        key: 'push',
        labelKey: 'profileNotifPush',
        hintKey: 'profileNotifPushHint',
        icon: 'phone-portrait-outline',
      },
      {
        key: 'email',
        labelKey: 'profileNotifEmail',
        hintKey: 'profileNotifEmailHint',
        icon: 'mail-outline',
      },
      {
        key: 'sms',
        labelKey: 'profileNotifSms',
        hintKey: 'profileNotifSmsHint',
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
