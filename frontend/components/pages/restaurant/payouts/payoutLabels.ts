import type { RestaurantStringKey, RestaurantT } from '@/constants/restaurantStrings';
import type { PayoutBadgeStatus, SettlementBreakdownLabels } from '@/components/pages/payouts';

const STATUS_KEYS: Record<PayoutBadgeStatus, RestaurantStringKey> = {
  Processing: 'payoutsStatusProcessing',
  Pending: 'payoutsStatusPending',
  Paid: 'payoutsStatusPaid',
  Verified: 'payoutsStatusVerified',
  Failed: 'payoutsStatusFailed',
  Rejected: 'payoutsStatusRejected',
  None: 'payoutsStatusNone',
};

export function payoutStatusLabel(status: PayoutBadgeStatus, t: RestaurantT): string {
  return t(STATUS_KEYS[status]);
}

export function settlementLabels(t: RestaurantT): SettlementBreakdownLabels {
  return {
    onlineSales: t('payoutsOnlineSales'),
    cashSales: t('payoutsCashSales'),
    commission: (rate, gross) => t('payoutsCommission', { rate, gross }),
    paymentFees: t('payoutsPaymentFees'),
    owes: t('payoutsYouOwe'),
    receives: t('payoutsFoodiePaysYou'),
  };
}

export function orderCountLabel(count: number, t: RestaurantT): string {
  return count === 1 ? t('payoutsOrderCountOne') : t('payoutsOrderCount', { count });
}
