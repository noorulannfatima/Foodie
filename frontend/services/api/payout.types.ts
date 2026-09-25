/** Payout shapes shared by the admin and restaurant APIs (see backend payout.service). */

export type PayoutStatus = 'Processing' | 'Paid' | 'Failed';
export type PayoutAccountStatus = 'Pending' | 'Verified' | 'Rejected';
export type PayoutMethod = 'Bank' | 'JazzCash' | 'Easypaisa';

export interface Settlement {
  orderCount: number;
  grossSales: number;
  onlineSales: number;
  cashSales: number;
  commission: number;
  paymentFees: number;
  /** Negative when the restaurant owes Foodie (commission on cash orders). */
  netAmount: number;
}

export interface PayoutAccount {
  method: PayoutMethod;
  accountTitle: string;
  bankName?: string;
  iban?: string;
  mobileNumber?: string;
  status: PayoutAccountStatus;
  rejectionReason?: string;
  updatedAt: string;
}

/** A settled batch of orders. `orders` ids are only returned by the detail endpoints. */
export interface Payout extends Settlement {
  _id: string;
  periodStart: string;
  periodEnd: string;
  commissionRate: number;
  status: PayoutStatus;
  reference?: string;
  paidAt?: string;
  failureReason?: string;
  accountSnapshot?: PayoutAccount;
  createdAt: string;
}

export interface PayoutOrderRow {
  _id: string;
  orderNumber: string;
  subtotal: number;
  method: string;
  deliveredAt: string;
}

// ========== Restaurant-facing responses (/restaurant/payouts) ==========

export interface RestaurantPayoutSummary {
  commissionRate: number;
  paymentFeeRate: number;
  unsettled: Settlement;
  processing: { count: number; amount: number };
  lastPaid: Pick<Payout, '_id' | 'netAmount' | 'paidAt' | 'reference' | 'periodStart' | 'periodEnd'> | null;
  payoutAccount: PayoutAccount | null;
}

export interface PayoutHistoryPage {
  payouts: Payout[];
  page: number;
  hasMore: boolean;
}

export interface PayoutAccountInput {
  method: PayoutMethod;
  accountTitle: string;
  bankName?: string;
  iban?: string;
  mobileNumber?: string;
  currentPassword: string;
}
