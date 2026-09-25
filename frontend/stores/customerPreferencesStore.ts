import { useCallback } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import zustandStorage from '@/utils/zustandStorage';
import {
  customerAPI,
  type CustomerNotificationPreferences,
  type CustomerPreferences,
} from '@/services/api/customer.api';
import {
  customerT,
  type CustomerLanguage,
  type CustomerStringKey,
} from '@/constants/customerStrings';

const DEFAULT_NOTIFICATIONS: CustomerNotificationPreferences = {
  push: true,
  orderUpdates: true,
  promotions: true,
};

interface CustomerPreferencesState extends CustomerPreferences {
  /** Pulls the server copy (the source of truth across devices). */
  load: () => Promise<void>;
  /** Switches immediately; the server copy follows. Throws if the server rejects it. */
  setLanguage: (language: CustomerLanguage) => Promise<void>;
  /** Optimistic; rolls back and throws if the server rejects it. */
  setNotification: (key: keyof CustomerNotificationPreferences, value: boolean) => Promise<void>;
  reset: () => void;
}

/**
 * Customer language + notification switches. Persisted on the device so the
 * app renders in the right language before the network answers.
 */
export const useCustomerPreferencesStore = create<CustomerPreferencesState>()(
  persist(
    (set, get) => ({
      language: 'en',
      notifications: DEFAULT_NOTIFICATIONS,

      load: async () => {
        const prefs = await customerAPI.getPreferences();
        set({ language: prefs.language, notifications: prefs.notifications });
      },

      setLanguage: async (language) => {
        set({ language });
        await customerAPI.updatePreferences({ language });
      },

      setNotification: async (key, value) => {
        const previous = get().notifications;
        set({ notifications: { ...previous, [key]: value } });
        try {
          const saved = await customerAPI.updatePreferences({ notifications: { [key]: value } });
          set({ notifications: saved.notifications });
        } catch (error) {
          set({ notifications: previous });
          throw error;
        }
      },

      reset: () => set({ language: 'en', notifications: DEFAULT_NOTIFICATIONS }),
    }),
    {
      name: 'foodie-customer-preferences',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({ language: s.language, notifications: s.notifications }),
    },
  ),
);

/** `t(key, params?)` in the customer's chosen language; re-renders when it changes. */
export function useCustomerT() {
  const language = useCustomerPreferencesStore((s) => s.language);
  return useCallback(
    (key: CustomerStringKey, params?: Record<string, string | number>) =>
      customerT(language, key, params),
    [language],
  );
}
