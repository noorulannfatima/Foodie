/**
 * Restaurant settlement math. Pure: no DB access, so it is easy to test and
 * reuse for both live "unsettled" balances and frozen Payout records.
 *
 * Money model: Foodie collects online payments; for cash orders the restaurant
 * keeps the cash. Commission is owed on every order, so a restaurant with mostly
 * cash orders can end up with a negative net (it owes Foodie).
 */

export const DEFAULT_COMMISSION_RATE = 0.15;
const DEFAULT_PAYMENT_FEE_RATE = 0.025;

export interface SettlementOrder {
  pricing: { subtotal: number };
  payment: { method: string };
}

export interface Settlement {
  orderCount: number;
  grossSales: number;
  onlineSales: number;
  cashSales: number;
  commission: number;
  paymentFees: number;
  netAmount: number;
}

/** Safepay's cut on online orders, charged to the restaurant. */
export function getPaymentFeeRate(): number {
  const rate = Number(process.env.SAFEPAY_FEE_RATE);
  return Number.isFinite(rate) && rate >= 0 ? rate : DEFAULT_PAYMENT_FEE_RATE;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeSettlement(
  orders: SettlementOrder[],
  commissionRate: number,
  feeRate: number = getPaymentFeeRate()
): Settlement {
  let onlineSales = 0;
  let cashSales = 0;
  for (const order of orders) {
    const subtotal = order.pricing?.subtotal ?? 0;
    if (order.payment?.method === 'Cash') cashSales += subtotal;
    else onlineSales += subtotal;
  }

  onlineSales = round2(onlineSales);
  cashSales = round2(cashSales);
  const grossSales = round2(onlineSales + cashSales);
  const commission = round2(grossSales * commissionRate);
  const paymentFees = round2(onlineSales * feeRate);

  return {
    orderCount: orders.length,
    grossSales,
    onlineSales,
    cashSales,
    commission,
    paymentFees,
    netAmount: round2(onlineSales - commission - paymentFees),
  };
}
