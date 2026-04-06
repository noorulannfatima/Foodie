import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { SignupData } from '@/stores/authStore';

const localhost = Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL = `http://${localhost}:5000`;

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const authAPI = {
  signup: async (data: SignupData, role: string) => {
    const res = await fetch(`${BASE_URL}/auth/${role}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  login: async (email: string, password: string, role: string) => {
    const res = await fetch(`${BASE_URL}/auth/${role}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  verifyToken: async () => {
    const res = await fetch(`${BASE_URL}/auth/verify`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },
};