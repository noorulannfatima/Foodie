import type { AppLanguage } from '@/stores/appLanguageStore';

type Keys =
  | 'tabOverview'
  | 'tabPayouts'
  | 'tabRestaurants'
  | 'tabSettings'
  | 'settingsTitle'
  | 'administrator'
  | 'appearance'
  | 'darkMode'
  | 'darkModeHint'
  | 'language'
  | 'languageHint'
  | 'signOut'
  | 'signOutConfirm'
  | 'cancel'
  | 'version';

const STR: Record<AppLanguage, Record<Keys, string>> = {
  en: {
    tabOverview: 'Overview',
    tabPayouts: 'Payouts',
    tabRestaurants: 'Restaurants',
    tabSettings: 'Settings',
    settingsTitle: 'Settings',
    administrator: 'ADMIN',
    appearance: 'APPEARANCE',
    darkMode: 'Dark mode',
    darkModeHint: 'Easier on the eyes at night',
    language: 'LANGUAGE',
    languageHint: 'Applies to menus and settings on this device',
    signOut: 'Sign out',
    signOutConfirm: 'Are you sure you want to sign out?',
    cancel: 'Cancel',
    version: 'Version',
  },
  es: {
    tabOverview: 'Resumen',
    tabPayouts: 'Pagos',
    tabRestaurants: 'Restaurantes',
    tabSettings: 'Ajustes',
    settingsTitle: 'Ajustes',
    administrator: 'ADMIN',
    appearance: 'APARIENCIA',
    darkMode: 'Modo oscuro',
    darkModeHint: 'Más cómodo para la vista de noche',
    language: 'IDIOMA',
    languageHint: 'Se aplica a menús y ajustes en este dispositivo',
    signOut: 'Cerrar sesión',
    signOutConfirm: '¿Seguro que quieres cerrar sesión?',
    cancel: 'Cancelar',
    version: 'Versión',
  },
  fr: {
    tabOverview: 'Aperçu',
    tabPayouts: 'Paiements',
    tabRestaurants: 'Restaurants',
    tabSettings: 'Réglages',
    settingsTitle: 'Réglages',
    administrator: 'ADMIN',
    appearance: 'APPARENCE',
    darkMode: 'Mode sombre',
    darkModeHint: 'Plus reposant pour les yeux le soir',
    language: 'LANGUE',
    languageHint: 'S’applique aux menus et réglages sur cet appareil',
    signOut: 'Se déconnecter',
    signOutConfirm: 'Voulez-vous vraiment vous déconnecter ?',
    cancel: 'Annuler',
    version: 'Version',
  },
  ur: {
    tabOverview: 'جائزہ',
    tabPayouts: 'ادائیگیاں',
    tabRestaurants: 'ریستوران',
    tabSettings: 'ترتیبات',
    settingsTitle: 'ترتیبات',
    administrator: 'ایڈمن',
    appearance: 'ظاہری شکل',
    darkMode: 'ڈارک موڈ',
    darkModeHint: 'رات کو آنکھوں کے لیے آرام دہ',
    language: 'زبان',
    languageHint: 'اس ڈیوائس پر مینو اور ترتیبات پر لاگو ہوتی ہے',
    signOut: 'سائن آؤٹ',
    signOutConfirm: 'کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟',
    cancel: 'منسوخ',
    version: 'ورژن',
  },
};

export function adminT(lang: AppLanguage, key: Keys): string {
  return STR[lang]?.[key] ?? STR.en[key];
}
