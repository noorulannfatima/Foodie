import { apiClient } from './client';
import type { DeliveryLanguage } from '@/stores/deliveryPreferencesStore';

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
  restaurant: {
    id: string;
    name: string;
    image?: string;
    addressLine: string;
  } | null;
  deliveryAddress: { street: string; city: string; zipCode: string };
  milesAway?: number;
  prepMinutes?: number;
  tag?: 'HOT_ORDER';
  driverEarnings?: number;
  completedAt?: string;
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

  async getActiveOrder(): Promise<{ order: DeliveryOrderPayload | null }> {
    const { data } = await apiClient.get<{ order: DeliveryOrderPayload | null }>(
      '/api/delivery/orders/active',
    );
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

  async acceptOrder(orderId: string): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(
      `/api/delivery/orders/${orderId}/accept`,
    );
    return data;
  },

  async updateOrderStatus(
    orderId: string,
    status: 'PickedUp' | 'OutForDelivery' | 'Delivered',
  ): Promise<{ ok: boolean }> {
    const { data } = await apiClient.patch<{ ok: boolean }>(
      `/api/delivery/orders/${orderId}/status`,
      { status },
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
