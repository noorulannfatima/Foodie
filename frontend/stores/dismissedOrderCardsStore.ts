import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import zustandStorage from '@/utils/zustandStorage';

// Finished orders stop coming back from the API after 30 minutes, so this list only
// needs to cover that window; cap it so it can't grow forever.
const MAX_DISMISSED = 20;

interface State {
  dismissedIds: string[];
  dismiss: (orderId: string) => void;
}

/** Delivered/cancelled orders the customer closed on the home status card */
export const useDismissedOrderCardsStore = create<State>()(
  persist(
    (set) => ({
      dismissedIds: [],
      dismiss: (orderId) =>
        set((s) =>
          s.dismissedIds.includes(orderId)
            ? s
            : { dismissedIds: [orderId, ...s.dismissedIds].slice(0, MAX_DISMISSED) },
        ),
    }),
    { name: 'dismissed-order-cards', storage: createJSONStorage(() => zustandStorage) },
  ),
);
