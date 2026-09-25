import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from './baseUrl';
import type { SubmitReviewBody } from './review.types';
import type { CustomerLanguage } from '@/constants/customerStrings';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    // `status` lets callers tell e.g. "already reviewed" (409) apart from other failures
    throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status });
  }
  return data;
}

export interface CustomerNotificationPreferences {
  push: boolean;
  orderUpdates: boolean;
  promotions: boolean;
}

export interface CustomerPreferences {
  notifications: CustomerNotificationPreferences;
  language: CustomerLanguage;
}

/** Lean order shape returned by GET /orders/active for the home status card */
export interface ActiveOrder {
  _id: string;
  orderNumber: string;
  status: string;
  estimatedDeliveryTime?: string;
  cancellationReason?: string;
  updatedAt: string;
  restaurant: { _id: string; name: string; logo?: string } | null;
  deliveryPerson: { _id: string; name: string } | null;
  isReviewed: boolean;
}

/** A dish as customers see it (averageRating is derived from reviews). */
export interface CustomerMenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  image: string[];
  category: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel?: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  preparationTime: number;
  calories?: number;
  isAvailable: boolean;
  averageRating: number;
  ratingCount: number;
}

/** One customer's rating (and comment) of one dish. */
export interface DishReview {
  id: string;
  customerFirstName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MenuItemDetail {
  item: CustomerMenuItem;
  restaurant: { _id: string; name: string; isActive: boolean; isBusy: boolean };
  reviews: {
    /** Number of ratings per star, keys "1"–"5". */
    breakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
    /** Reviews with a comment; ratings without one only count in the breakdown. */
    writtenCount: number;
    latest: DishReview[];
  };
}

/** A delivery address saved to the customer's profile. */
export interface SavedAddress {
  _id: string;
  label: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  instructions?: string;
  isDefault: boolean;
}

export type SavedAddressInput = Omit<SavedAddress, '_id' | 'isDefault'>;

/** Ideas shown on the empty cart screen. */
export interface CartSuggestions {
  lastOrder: {
    _id: string;
    orderNumber: string;
    createdAt: string;
    total: number;
    restaurant: { _id: string; name: string; logo?: string; image?: string[] } | null;
    items: Array<{ name: string; quantity: number }>;
  } | null;
  /** Dishes in the most delivered orders across all customers lately, most ordered first. */
  popularItems: Array<{
    menuItem: string;
    name: string;
    price: number;
    image: string | null;
    orderCount: number;
    restaurant: { _id: string; name: string };
  }>;
}

export const customerAPI = {
  // ========== Preferences ==========
  getPreferences: async (): Promise<CustomerPreferences> => {
    const res = await fetch(`${BASE_URL}/api/customer/preferences`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updatePreferences: async (
    update: { notifications?: Partial<CustomerNotificationPreferences>; language?: CustomerLanguage },
  ): Promise<CustomerPreferences> => {
    const res = await fetch(`${BASE_URL}/api/customer/preferences`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(update),
    });
    return handleResponse(res);
  },

  // ========== Push Notifications ==========
  registerPushToken: async (token: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/push-token`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ token }),
    });
    return handleResponse(res);
  },

  unregisterPushToken: async (token: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/push-token`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ token }),
    });
    return handleResponse(res);
  },

  // ========== Saved addresses ==========
  // Every call returns the full list: default first, then newest first.

  getAddresses: async (): Promise<{ addresses: SavedAddress[] }> => {
    const res = await fetch(`${BASE_URL}/api/customer/addresses`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** Saving an address that already exists returns the list unchanged. */
  addAddress: async (
    address: SavedAddressInput & { isDefault?: boolean },
  ): Promise<{ addresses: SavedAddress[] }> => {
    const res = await fetch(`${BASE_URL}/api/customer/addresses`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(address),
    });
    return handleResponse(res);
  },

  updateAddress: async (
    id: string,
    update: Partial<SavedAddressInput>,
  ): Promise<{ addresses: SavedAddress[] }> => {
    const res = await fetch(`${BASE_URL}/api/customer/addresses/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(update),
    });
    return handleResponse(res);
  },

  setDefaultAddress: async (id: string): Promise<{ addresses: SavedAddress[] }> => {
    const res = await fetch(`${BASE_URL}/api/customer/addresses/${id}/default`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  deleteAddress: async (id: string): Promise<{ addresses: SavedAddress[] }> => {
    const res = await fetch(`${BASE_URL}/api/customer/addresses/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

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

  /** One dish with its review summary, for the dish detail page. */
  getMenuItemDetail: async (restaurantId: string, itemId: string): Promise<MenuItemDetail> => {
    const res = await fetch(`${BASE_URL}/api/customer/restaurants/${restaurantId}/items/${itemId}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** Written reviews of one dish, newest first; `rating` keeps one star count. */
  getMenuItemReviews: async (
    restaurantId: string,
    itemId: string,
    params: { rating?: number; page?: number; limit?: number } = {},
  ): Promise<{
    reviews: DishReview[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> => {
    const query = new URLSearchParams();
    if (params.rating) query.set('rating', String(params.rating));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const res = await fetch(
      `${BASE_URL}/api/customer/restaurants/${restaurantId}/items/${itemId}/reviews?${query.toString()}`,
      { headers: await getAuthHeaders() },
    );
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

  /** Last delivered order and popular dishes, for the empty cart screen. */
  getCartSuggestions: async (): Promise<CartSuggestions> => {
    const res = await fetch(`${BASE_URL}/api/customer/cart/suggestions`, {
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

  /**
   * Undo a checkout whose payment step failed: the backend cancels the
   * unpaid order and restores the cart it came from.
   */
  rollbackOrder: async (orderId: string, reason?: string) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/rollback`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ reason }),
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

  getActiveOrders: async (): Promise<{ orders: ActiveOrder[] }> => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/active`, {
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

  /**
   * Review a delivered order: every distinct dish once, plus the rider if the
   * order had one. One review per order; it can't be edited afterwards.
   */
  submitReview: async (orderId: string, body: SubmitReviewBody) => {
    const res = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/review`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
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
