/**
 * UI strings for the restaurant app, split by area so each file stays readable.
 * Keys are prefixed by area (e.g. `ordersAccept`) so they never collide when
 * merged; shared words live in `common`.
 *
 * Use `{name}` placeholders for values, e.g. t('minutesAgo', { count: 5 }).
 * Restaurant-entered content (dish names, descriptions) is never translated.
 */
import { useCallback } from 'react';
import { useAppLanguageStore, type AppLanguage } from '@/stores/appLanguageStore';
import common from './common';
import dashboard from './dashboard';
import orders from './orders';
import menu from './menu';
import profile from './profile';
import payouts from './payouts';

type Merged = typeof common.en &
  typeof dashboard.en &
  typeof orders.en &
  typeof menu.en &
  typeof profile.en &
  typeof payouts.en;

export type RestaurantStringKey = keyof Merged & string;
export type RestaurantT = (key: RestaurantStringKey, params?: Record<string, string | number>) => string;

const PARTS = [common, dashboard, orders, menu, profile, payouts];

const STR = Object.fromEntries(
  (['en', 'ur', 'es', 'fr'] as AppLanguage[]).map((lang) => [
    lang,
    Object.assign({}, ...PARTS.map((part) => part[lang])),
  ]),
) as Record<AppLanguage, Record<RestaurantStringKey, string>>;

export function restaurantT(
  language: AppLanguage,
  key: RestaurantStringKey,
  params?: Record<string, string | number>,
): string {
  const template = STR[language]?.[key] ?? STR.en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
}

/** Translator bound to the device language; re-renders the caller when it changes. */
export function useRestaurantT(): RestaurantT {
  const language = useAppLanguageStore((s) => s.language);
  return useCallback((key, params) => restaurantT(language, key, params), [language]);
}

const LOCALES: Record<AppLanguage, string> = {
  en: 'en-US',
  ur: 'ur-PK',
  es: 'es-ES',
  fr: 'fr-FR',
};

/** BCP-47 locale for formatting dates in the current language. */
export function useRestaurantLocale(): string {
  return LOCALES[useAppLanguageStore((s) => s.language)];
}

const STATUS_KEYS: Record<string, RestaurantStringKey> = {
  Pending: 'statusPending',
  Confirmed: 'statusConfirmed',
  Preparing: 'statusPreparing',
  Ready: 'statusReady',
  PickedUp: 'statusPickedUp',
  OutForDelivery: 'statusOutForDelivery',
  Delivered: 'statusDelivered',
  Cancelled: 'statusCancelled',
};

/** Translated label for a backend order status; unknown statuses pass through. */
export function orderStatusLabel(status: string, t: RestaurantT): string {
  const key = STATUS_KEYS[status];
  return key ? t(key) : status;
}
