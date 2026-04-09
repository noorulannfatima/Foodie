import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api/auth.api';
import { useDeliveryPreferencesStore } from '@/stores/deliveryPreferencesStore';

type UserRole = 'customer' | 'restaurant' | 'delivery';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  // Restaurant-specific fields
  description?: string;
  address?: { street: string; city: string; zipCode: string; country: string };
  cuisineTypes?: string[];
  deliveryOptions?: string[];
  paymentMethods?: string[];
  minimumOrder?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
  estimatedDeliveryTime?: number;
  // Delivery-specific fields
  vehicle?: { type: string; plateNumber: string; model?: string; color?: string };
  licenseNumber?: string;
  licenseExpiry?: Date;
  emergencyContact?: { name: string; phone: string; relation?: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (data: SignupData, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password, role) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login(email, password, role);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('userRole', role);
      set({ user: response.user, token: response.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (data, role) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.signup(data, role);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('userRole', role);
      set({ user: response.user, token: response.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userRole');
    useDeliveryPreferencesStore.getState().reset();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await authAPI.verifyToken();
        set({ user: response.user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      // Token invalid or expired — clear storage and reset state
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userRole');
      useDeliveryPreferencesStore.getState().reset();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));