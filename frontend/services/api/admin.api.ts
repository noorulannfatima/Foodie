import { apiClient } from './client';
import type {
  AdminOverview,
  AdminPayout,
  AdminRestaurant,
  PayoutAccount,
  PayoutOrderRow,
  PayoutStatus,
} from './admin.types';

export const adminAPI = {
  // ========== Overview ==========
  getOverview: async (): Promise<AdminOverview> => {
    const res = await apiClient.get('/api/admin/overview');
    return res.data;
  },

  // ========== Restaurants ==========
  getRestaurants: async (): Promise<AdminRestaurant[]> => {
    const res = await apiClient.get('/api/admin/restaurants');
    return res.data.restaurants;
  },

  setCommission: async (restaurantId: string, rate: number): Promise<number> => {
    const res = await apiClient.patch(`/api/admin/restaurants/${restaurantId}/commission`, { rate });
    return res.data.restaurant.commissionRate;
  },

  reviewPayoutAccount: async (
    restaurantId: string,
    status: 'Verified' | 'Rejected',
    reason?: string,
  ): Promise<PayoutAccount> => {
    const res = await apiClient.patch(`/api/admin/restaurants/${restaurantId}/payout-account`, {
      status,
      reason,
    });
    return res.data.payoutAccount;
  },

  // ========== Payouts ==========
  generatePayouts: async (periodEnd?: Date): Promise<AdminPayout[]> => {
    const res = await apiClient.post('/api/admin/payouts/generate', {
      ...(periodEnd ? { periodEnd: periodEnd.toISOString() } : {}),
    });
    return res.data.created;
  },

  getPayouts: async (status?: PayoutStatus): Promise<AdminPayout[]> => {
    const res = await apiClient.get('/api/admin/payouts', { params: status ? { status } : {} });
    return res.data.payouts;
  },

  getPayout: async (id: string): Promise<{ payout: AdminPayout; orders: PayoutOrderRow[] }> => {
    const res = await apiClient.get(`/api/admin/payouts/${id}`);
    return res.data;
  },

  markPaid: async (id: string, reference: string): Promise<AdminPayout> => {
    const res = await apiClient.patch(`/api/admin/payouts/${id}/paid`, { reference });
    return res.data.payout;
  },

  markFailed: async (id: string, reason: string): Promise<AdminPayout> => {
    const res = await apiClient.patch(`/api/admin/payouts/${id}/failed`, { reason });
    return res.data.payout;
  },
};
