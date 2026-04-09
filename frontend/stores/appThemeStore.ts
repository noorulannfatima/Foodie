import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import zustandStorage from '@/utils/zustandStorage';

/**
 * Global app appearance (customer, restaurant, delivery). Persisted across sessions and roles.
 */
interface AppThemeState {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  toggleDark: () => void;
}

export const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      setIsDark: (value) => set({ isDark: value }),
      toggleDark: () => set((s) => ({ isDark: !s.isDark })),
    }),
    { name: 'foodie-app-appearance', storage: createJSONStorage(() => zustandStorage) },
  ),
);
