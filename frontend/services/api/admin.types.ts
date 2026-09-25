/** Response shapes for /api/admin (see backend/src/controllers/admin.controller.ts). */
import type { Payout, PayoutAccount, Settlement } from './payout.types';

export type {
  PayoutAccount,
  PayoutAccountStatus,
  PayoutMethod,
  PayoutOrderRow,
  PayoutStatus,
  Settlement,
} from './payout.types';

export interface AdminOverview {
  unsettledNet: number;
  unsettledOrders: number;
  processingCount: number;
  processingAmount: number;
  paidThisMonth: number;
  pendingAccounts: number;
}

export interface AdminRestaurant {
  _id: string;
  name: string;
  address?: { street: string; city: string };
  commissionRate: number;
  payoutAccount: PayoutAccount | null;
  unsettled: Settlement;
}

export interface AdminPayout extends Payout {
  restaurant: { _id: string; name: string };
}
