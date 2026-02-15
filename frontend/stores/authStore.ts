import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'customer' | 'restaurant' | 'delivery';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
      set({ 
        user: response.user, 
        token: response.token, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (data, role) => {
    // Similar implementation
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // Verify token and load user
    }
  },
}));