import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import zustandStorage from '@/utils/zustandStorage';
import { useAppThemeStore } from '@/stores/appThemeStore';

export type DeliveryLanguage = 'en' | 'es' | 'fr' | 'ur';

export interface DeliveryPreferencesPayload {
  darkMode: boolean;
  notificationsEnabled: boolean;
  language: DeliveryLanguage;
}

interface State extends DeliveryPreferencesPayload {
  mergeFromServer: (p: Partial<DeliveryPreferencesPayload>) => void;
  reset: () => void;
}

const defaults: DeliveryPreferencesPayload = {
  darkMode: false,
  notificationsEnabled: true,
  language: 'en',
};

function normLang(v: unknown): DeliveryLanguage {
  if (v === 'en' || v === 'es' || v === 'fr' || v === 'ur') return v;
  return 'en';
}

export const useDeliveryPreferencesStore = create<State>()(
  persist(
    (set) => ({
      ...defaults,
      mergeFromServer: (p) => {
        const darkMode = typeof p.darkMode === 'boolean' ? p.darkMode : defaults.darkMode;
        const notificationsEnabled =
          typeof p.notificationsEnabled === 'boolean'
            ? p.notificationsEnabled
            : defaults.notificationsEnabled;
        const language = normLang(p.language);
        set({ darkMode, notificationsEnabled, language });
        // Keep global app appearance in sync when delivery prefs load from API
        useAppThemeStore.getState().setIsDark(darkMode);
      },
      reset: () =>
        set({
          ...defaults,
          darkMode: useAppThemeStore.getState().isDark,
        }),
    }),
    { name: 'delivery-preferences', storage: createJSONStorage(() => zustandStorage) },
  ),
);
