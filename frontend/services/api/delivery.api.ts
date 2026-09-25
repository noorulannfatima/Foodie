import { apiClient } from './client';
import type { DeliveryLanguage } from '@/stores/deliveryPreferencesStore';
import type { DeliveryReviewsResponse } from './review.types';

export type DeliveryPreferences = {
  darkMode: boolean;
  notificationsEnabled: boolean;
  language: DeliveryLanguage;
};

export type DeliveryProfile = {
  name: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  isOnline: boolean;
  isVerified: boolean;
  createdAt: string;
  vehicle: {
    type: string;
    model?: string;
    plateNumber: string;
    color?: string;
  };
  licenseNumber: string;
  licenseExpiry?: string;
  documents?: Record<string, string | undefined>;
  preferences?: DeliveryPreferences;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  stats: {
    totalDeliveries: number;
    completedDeliveries: number;
    averageRating: number;
    totalRatings: number;
  };
  earnings: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
  };
  deliveryHistory: Array<{
    order: string;
    earnings: number;
    distance: number;
    status: string;
    createdAt: string;
  }>;
  completionRate: number;
  tierLabel: string;
};

export type PatchDeliveryProfileBody = {
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string | null;
  vehicle?: {
    type?: string;
    model?: string;
    plateNumber?: string;
    color?: string;
  };
  licenseNumber?: string;
  licenseExpiry?: string | null;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  } | null;
  passwordUpdate?: { current: string; next: string };
};

export type DeliveryOrderPayload = {
  id: string;
  orderNumber: string;
  status: string;
  itemsSummary: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  estimatedPreparationTime: number;
  estPayout: number;
  pricing: { subtotal: number; deliveryFee: number; tax: number; tip: number; total: number };
  payment: { method: string; status: string };
  /** Cash to take at the door; 0 when already paid online. */
  cashToCollect: number;
  restaurant: {
    id: string;
    name: string;
    image?: string;
    addressLine: string;
    location?: { latitude: number; longitude: number };
  } | null;
  deliveryAddress: {
    street: string;
    city: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  /** Only on your own orders: name and phone while active, name alone in history. */
  customer?: { name: string; phone?: string } | null;
  specialInstructions?: string;
  milesAway?: number;
  prepMinutes?: number;
  tag?: 'HOT_ORDER';
  driverEarnings?: number;
  completedAt?: string;
};

/** An order the customer cancelled after you accepted it, until you dismiss it. */
export type CancelledDeliveryPayload = {
  id: string;
  orderNumber: string;
  restaurantName: string;
  cancellationReason: string | null;
  cancelledAt: string;
};

export type DeliveryReleaseReason = 'vehicle_issue' | 'too_far' | 'restaurant_delay' | 'personal' | 'other';

export type ActiveOrderResponse = {
  order: DeliveryOrderPayload | null;
  cancelledOrder: CancelledDeliveryPayload | null;
};

export const deliveryAPI = {
  async getMe(): Promise<{ profile: DeliveryProfile }> {
    const { data } = await apiClient.get<{ profile: DeliveryProfile }>('/api/delivery/me');
    return data;
  },

  async setOnline(isOnline: boolean): Promise<{ isOnline: boolean }> {
    const { data } = await apiClient.patch<{ isOnline: boolean }>('/api/delivery/online', {
      isOnline,
    });
    return data;
  },

  async getActiveOrder(): Promise<ActiveOrderResponse> {
    const { data } = await apiClient.get<ActiveOrderResponse>('/api/delivery/orders/active');
    return data;
  },

  async getOrderRequests(): Promise<{ orders: DeliveryOrderPayload[] }> {
    const { data } = await apiClient.get<{ orders: DeliveryOrderPayload[] }>(
      '/api/delivery/orders/requests',
    );
    return data;
  },

  async getOrderHistory(): Promise<{ orders: DeliveryOrderPayload[] }> {
    const { data } = await apiClient.get<{ orders: DeliveryOrderPayload[] }>(
      '/api/delivery/orders/history',
    );
    return data;
  },

  async getReviews(page = 1, limit = 20): Promise<DeliveryReviewsResponse> {
    const { data } = await apiClient.get<DeliveryReviewsResponse>('/api/delivery/reviews', {
      params: { page, limit },
    });
    return data;
  },

  async acceptOrder(orderId: string): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(
      `/api/delivery/orders/${orderId}/accept`,
    );
    return data;
  },

  /** `cashCollected` confirms the COD cash was taken; required to deliver an unpaid cash order. */
  async updateOrderStatus(
    orderId: string,
    status: 'PickedUp' | 'OutForDelivery' | 'Delivered',
    opts: { cashCollected?: boolean } = {},
  ): Promise<{ ok: boolean }> {
    const { data } = await apiClient.patch<{ ok: boolean }>(
      `/api/delivery/orders/${orderId}/status`,
      { status, ...opts },
    );
    return data;
  },

  async releaseOrder(orderId: string, reason: DeliveryReleaseReason): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(
      `/api/delivery/orders/${orderId}/release`,
      { reason },
    );
    return data;
  },

  async acknowledgeCancellation(orderId: string): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(
      `/api/delivery/orders/${orderId}/acknowledge-cancellation`,
    );
    return data;
  },

  async patchProfile(body: PatchDeliveryProfileBody): Promise<{ profile: DeliveryProfile }> {
    const { data } = await apiClient.patch<{ profile: DeliveryProfile }>(
      '/api/delivery/me/profile',
      body,
    );
    return data;
  },

  async patchPreferences(
    body: Partial<DeliveryPreferences>,
  ): Promise<{ preferences: DeliveryPreferences }> {
    const { data } = await apiClient.patch<{ preferences: DeliveryPreferences }>(
      '/api/delivery/me/preferences',
      body,
    );
    return data;
  },

  async deleteAccount(password: string): Promise<{ ok: boolean }> {
    const { data } = await apiClient.delete<{ ok: boolean }>('/api/delivery/me', {
      data: { password },
    });
    return data;
  },
};
