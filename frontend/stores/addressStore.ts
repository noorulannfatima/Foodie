import { create } from 'zustand';
import {
  customerAPI,
  type SavedAddress,
  type SavedAddressInput,
} from '@/services/api/customer.api';

interface AddressState {
  /** Default first, then newest first (the server's order). */
  addresses: SavedAddress[];
  loaded: boolean;

  load: () => Promise<void>;
  /** Throws if the server rejects it (e.g. the 10-address limit). */
  add: (address: SavedAddressInput & { isDefault?: boolean }) => Promise<void>;
  update: (id: string, update: Partial<SavedAddressInput>) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

/**
 * The customer's saved delivery addresses, shared by the home "Deliver to"
 * row, checkout and Profile › Saved Addresses. Every change returns the full
 * list from the server, so the store just replaces it.
 */
export const useAddressStore = create<AddressState>((set) => ({
  addresses: [],
  loaded: false,

  load: async () => {
    const { addresses } = await customerAPI.getAddresses();
    set({ addresses, loaded: true });
  },

  add: async (address) => {
    const { addresses } = await customerAPI.addAddress(address);
    set({ addresses, loaded: true });
  },

  update: async (id, update) => {
    const { addresses } = await customerAPI.updateAddress(id, update);
    set({ addresses });
  },

  setDefault: async (id) => {
    const { addresses } = await customerAPI.setDefaultAddress(id);
    set({ addresses });
  },

  remove: async (id) => {
    const { addresses } = await customerAPI.deleteAddress(id);
    set({ addresses });
  },

  reset: () => set({ addresses: [], loaded: false }),
}));

export function selectDefaultAddress(s: AddressState): SavedAddress | null {
  return s.addresses.find((a) => a.isDefault) ?? null;
}

/** "12 Garden Rd, Karachi 74000" */
export function formatAddressLine(a: Pick<SavedAddress, 'streetAddress' | 'city' | 'zipCode'>): string {
  return `${a.streetAddress}, ${a.city} ${a.zipCode}`;
}
