import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from './baseUrl';
import type { RestaurantReviewsResponse } from './review.types';
import type {
  Payout,
  PayoutAccount,
  PayoutAccountInput,
  PayoutHistoryPage,
  PayoutOrderRow,
  RestaurantPayoutSummary,
} from './payout.types';

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

  // ========== Reviews ==========
  getReviews: async (page = 1, limit = 20): Promise<RestaurantReviewsResponse> => {
    const res = await fetch(`${BASE_URL}/restaurant/reviews?page=${page}&limit=${limit}`, {
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

  // ========== Notification Preferences ==========
  getNotificationPreferences: async () => {
    const res = await fetch(`${BASE_URL}/restaurant/notification-preferences`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateNotificationPreferences: async (data: Record<string, boolean>) => {
    const res = await fetch(`${BASE_URL}/restaurant/notification-preferences`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ========== Payouts & Billing ==========
  getPayoutSummary: async (): Promise<RestaurantPayoutSummary> => {
    const res = await fetch(`${BASE_URL}/restaurant/payouts/summary`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getPayouts: async (page = 1, limit = 20): Promise<PayoutHistoryPage> => {
    const res = await fetch(`${BASE_URL}/restaurant/payouts?page=${page}&limit=${limit}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getPayout: async (id: string): Promise<{ payout: Payout; orders: PayoutOrderRow[] }> => {
    const res = await fetch(`${BASE_URL}/restaurant/payouts/${id}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updatePayoutAccount: async (input: PayoutAccountInput): Promise<PayoutAccount> => {
    const res = await fetch(`${BASE_URL}/restaurant/payouts/account`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(input),
    });
    return (await handleResponse(res)).payoutAccount;
  },

  // ========== Push Notifications ==========
  registerPushToken: async (token: string) => {
    const res = await fetch(`${BASE_URL}/restaurant/push-token`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ token }),
    });
    return handleResponse(res);
  },

  unregisterPushToken: async (token: string) => {
    const res = await fetch(`${BASE_URL}/restaurant/push-token`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ token }),
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
