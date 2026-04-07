import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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

export const restaurantAPI = {
  // ========== Dashboard ==========
  getDashboard: async () => {
    const res = await fetch(`${BASE_URL}/restaurant/dashboard`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ========== Profile ==========
  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/restaurant/profile`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (data: Record<string, any>) => {
    const res = await fetch(`${BASE_URL}/restaurant/profile`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateStatus: async (data: { isActive?: boolean; isBusy?: boolean }) => {
    const res = await fetch(`${BASE_URL}/restaurant/status`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ========== Orders ==========
  getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${BASE_URL}/restaurant/orders?${query.toString()}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getOrderDetail: async (orderId: string) => {
    const res = await fetch(`${BASE_URL}/restaurant/orders/${orderId}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateOrderStatus: async (orderId: string, status: string, note?: string) => {
    const res = await fetch(`${BASE_URL}/restaurant/orders/${orderId}/status`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, note }),
    });
    return handleResponse(res);
  },

  // ========== Menu ==========
  getMenu: async () => {
    const res = await fetch(`${BASE_URL}/restaurant/menu`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  addCategory: async (data: { name: string; description?: string }) => {
    const res = await fetch(`${BASE_URL}/restaurant/menu/category`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  addMenuItem: async (data: Record<string, any>) => {
    const res = await fetch(`${BASE_URL}/restaurant/menu/item`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateMenuItem: async (itemId: string, data: Record<string, any>) => {
    const res = await fetch(`${BASE_URL}/restaurant/menu/item/${itemId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteMenuItem: async (itemId: string) => {
    const res = await fetch(`${BASE_URL}/restaurant/menu/item/${itemId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  toggleItemAvailability: async (itemId: string, isAvailable: boolean) => {
    const res = await fetch(`${BASE_URL}/restaurant/menu/item/${itemId}/availability`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ isAvailable }),
    });
    return handleResponse(res);
  },
};
