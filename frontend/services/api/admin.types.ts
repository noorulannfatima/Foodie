/** Response shapes for /api/admin (see backend/src/controllers/admin.controller.ts). */

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

export interface AdminPayout extends Settlement {
  _id: string;
  restaurant: { _id: string; name: string };
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
