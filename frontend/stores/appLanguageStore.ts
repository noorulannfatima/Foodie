import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import zustandStorage from '@/utils/zustandStorage';
import type { DeliveryLanguage } from '@/stores/deliveryPreferencesStore';

/** Same language codes the delivery app supports. */
export type AppLanguage = DeliveryLanguage;

interface AppLanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

/** Device-local UI language for roles without a server-side preference (admin). */
export const useAppLanguageStore = create<AppLanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'foodie-app-language', storage: createJSONStorage(() => zustandStorage) },
  ),
);
