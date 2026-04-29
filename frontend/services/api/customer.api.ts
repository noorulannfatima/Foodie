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

export const customerAPI = {
  // ========== Home ==========
  getHome: async () => {
    const res = await fetch(`${BASE_URL}/api/customer/home`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ========== Restaurants ==========
  getRestaurantDetail: async (id: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/restaurants/${id}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ========== Search ==========
  search: async (query: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/search?query=${encodeURIComponent(query)}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ========== Cart ==========
  getCart: async () => {
    const res = await fetch(`${BASE_URL}/api/customer/cart`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Add a menu item to the cart. The backend re-resolves the item's name
   * and price from the database, so passing them from the client is
   * unnecessary (and would be ignored).
   */
  addToCart: async (data: {
    restaurantId: string;
    menuItem: string;
    quantity?: number;
    customizations?: any[];
    specialInstructions?: string;
  }) => {
    const res = await fetch(`${BASE_URL}/api/customer/cart/add`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const res = await fetch(`${BASE_URL}/api/customer/cart/update`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ itemId, quantity }),
    });
    return handleResponse(res);
  },

  removeCartItem: async (itemId: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/cart/item/${itemId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  clearCart: async () => {
    const res = await fetch(`${BASE_URL}/api/customer/cart`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ========== Orders ==========
  createOrder: async (data: {
    deliveryAddress: {
      street: string;
      city: string;
      zipCode: string;
      instructions?: string;
    };
    paymentMethod: string;
    specialInstructions?: string;
    tip?: number;
  }) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getOrders: async (params?: { status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));

    const res = await fetch(`${BASE_URL}/api/customer/orders?${query.toString()}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getOrderDetail: async (orderId: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/${orderId}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ========== Order actions ==========

  /** Cancel an in-flight order (only allowed in early statuses). */
  cancelOrder: async (orderId: string, reason?: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  /** Rate a delivered order. All three ratings (1-5) are required. */
  rateOrder: async (
    orderId: string,
    ratings: { restaurant: number; delivery: number; food: number; comment?: string },
  ) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/rate`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(ratings),
    });
    return handleResponse(res);
  },

  /** Re-create the cart from a past order. Returns { cart, skipped[] }. */
  reorder: async (orderId: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** Lightweight tracking payload for the live order-tracking screen. */
  trackOrder: async (orderId: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/track`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
