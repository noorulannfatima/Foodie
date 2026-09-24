import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignupData } from '@/stores/authStore';
import { API_BASE_URL } from './baseUrl';

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

// fetch with a timeout so a request that can't reach the backend fails with a
// clear message instead of spinning forever. Surfaces the URL being used to
// make device/LAN misconfiguration obvious.
async function apiFetch(path: string, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Server is taking too long to respond (${API_BASE_URL}).`);
    }
    // Network-level failure (server down, wrong host, device not on same LAN…)
    throw new Error(`Cannot reach the server at ${API_BASE_URL}. Check your connection.`);
  } finally {
    clearTimeout(timer);
  }
}

export const authAPI = {
  signup: async (data: SignupData, role: string) => {
    const res = await apiFetch(`/auth/${role}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  login: async (email: string, password: string, role: string) => {
    const res = await apiFetch(`/auth/${role}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  verifyToken: async () => {
    const res = await apiFetch(`/auth/verify`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email: string, role: string) => {
    const res = await apiFetch(`/auth/${role}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (
    email: string,
    code: string,
    newPassword: string,
    role: string
  ) => {
    const res = await apiFetch(`/auth/${role}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    return handleResponse(res);
  },
};