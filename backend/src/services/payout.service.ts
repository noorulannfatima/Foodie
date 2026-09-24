import mongoose from 'mongoose';
import Order from '../models/order';
import Restaurant from '../models/restaurant';
import Payout, { IPayout } from '../models/payout';
import { notifyRestaurant } from './push.service';
import {
  computeSettlement,
  DEFAULT_COMMISSION_RATE,
  Settlement,
  SettlementOrder,
} from './payoutCalculator';

/** Delivered, not refunded, and not yet part of a payout. `payout: null` also matches a missing field. */
export const ELIGIBLE_ORDER_FILTER = {
  status: 'Delivered',
  'payment.status': { $ne: 'Refunded' },
  payout: null,
};

/** Thrown for expected failures; `status` is the HTTP status the controller should send. */
export class PayoutError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type EligibleOrder = SettlementOrder & {
  _id: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  actualDeliveryTime?: Date;
  updatedAt: Date;
};

const ORDER_FIELDS = '_id restaurant pricing.subtotal payment.method actualDeliveryTime updatedAt';

function deliveredAt(order: EligibleOrder): Date {
  return order.actualDeliveryTime ?? order.updatedAt;
}

function groupByRestaurant(orders: EligibleOrder[]): Map<string, EligibleOrder[]> {
  const groups = new Map<string, EligibleOrder[]>();
  for (const order of orders) {
    const key = String(order.restaurant);
    const group = groups.get(key);
    if (group) group.push(order);
    else groups.set(key, [order]);
  }
  return groups;
}

async function getCommissionRates(ids: string[]): Promise<Map<string, number>> {
  const restaurants = await Restaurant.find({ _id: { $in: ids } })
    .select('commissionRate')
    .lean();
  return new Map(
    restaurants.map((r) => [String(r._id), r.commissionRate ?? DEFAULT_COMMISSION_RATE])
  );
}

/**
 * Live settlement of each restaurant's not-yet-paid-out orders, keyed by
 * restaurant id. Restaurants with no eligible orders are absent.
 */
export async function getUnsettledSummaries(
  restaurantIds?: mongoose.Types.ObjectId[]
): Promise<Map<string, Settlement>> {
  const filter = restaurantIds
    ? { ...ELIGIBLE_ORDER_FILTER, restaurant: { $in: restaurantIds } }
    : ELIGIBLE_ORDER_FILTER;
  const orders = (await Order.find(filter).select(ORDER_FIELDS).lean()) as EligibleOrder[];
  const groups = groupByRestaurant(orders);
  const rates = await getCommissionRates([...groups.keys()]);

  const summaries = new Map<string, Settlement>();
  for (const [id, group] of groups) {
    summaries.set(id, computeSettlement(group, rates.get(id) ?? DEFAULT_COMMISSION_RATE));
  }
  return summaries;
}

/**
 * Freezes every restaurant's eligible orders delivered up to `periodEnd` into
 * one Processing payout each. Orders are claimed with a conditional update
 * (`payout: null`), so two concurrent runs can never settle the same order twice.
 */
export async function generatePayouts(periodEnd: Date = new Date()): Promise<IPayout[]> {
  const candidates = (await Order.find({
    ...ELIGIBLE_ORDER_FILTER,
    $or: [
      { actualDeliveryTime: { $lte: periodEnd } },
      // Older/seeded orders may lack a delivery time
      { actualDeliveryTime: null, updatedAt: { $lte: periodEnd } },
    ],
  })
    .select(ORDER_FIELDS)
    .lean()) as EligibleOrder[];

  const groups = groupByRestaurant(candidates);
  const rates = await getCommissionRates([...groups.keys()]);
  const created: IPayout[] = [];

  for (const [restaurantId, group] of groups) {
    const payoutId = new mongoose.Types.ObjectId();
    await Order.updateMany(
      { _id: { $in: group.map((o) => o._id) }, payout: null },
      { $set: { payout: payoutId } }
    );

    // Only what this run actually claimed; a concurrent run may have taken some
    const claimed = (await Order.find({ payout: payoutId })
      .select(ORDER_FIELDS)
      .lean()) as EligibleOrder[];
    if (!claimed.length) continue;

    const commissionRate = rates.get(restaurantId) ?? DEFAULT_COMMISSION_RATE;
    try {
      const payout = await Payout.create({
        _id: payoutId,
        restaurant: restaurantId,
        periodStart: new Date(Math.min(...claimed.map((o) => deliveredAt(o).getTime()))),
        periodEnd,
        orders: claimed.map((o) => o._id),
        commissionRate,
        ...computeSettlement(claimed, commissionRate),
      });
      created.push(payout);
    } catch (error) {
      // Release the orders so the next run can pick them up
      await Order.updateMany({ payout: payoutId }, { $unset: { payout: 1 } });
      throw error;
    }
  }

  return created;
}

async function findPayoutOrThrow(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new PayoutError(400, 'Invalid payout id');
  const payout = await Payout.findById(id);
  if (!payout) throw new PayoutError(404, 'Payout not found');
  return payout;
}

function formatPeriod(payout: IPayout): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(payout.periodStart)} – ${fmt(payout.periodEnd)}`;
}

export async function markPayoutPaid(id: string, reference: string): Promise<IPayout> {
  const payout = await findPayoutOrThrow(id);
  if (payout.status === 'Paid') throw new PayoutError(409, 'Payout is already marked paid');

  const restaurant = await Restaurant.findById(payout.restaurant).select('payoutAccount');
  if (!restaurant) throw new PayoutError(404, 'Restaurant not found');
  if (restaurant.payoutAccount?.status !== 'Verified') {
    throw new PayoutError(409, 'Payout account is not verified');
  }

  payout.status = 'Paid';
  payout.reference = reference;
  payout.paidAt = new Date();
  payout.failureReason = undefined;
  payout.accountSnapshot = restaurant.payoutAccount;
  await payout.save();

  const amount = Math.abs(payout.netAmount).toLocaleString('en-PK');
  void notifyRestaurant(payout.restaurant, 'payouts', {
    title: payout.netAmount >= 0 ? 'Payout sent' : 'Payment received',
    body:
      payout.netAmount >= 0
        ? `PKR ${amount} for ${formatPeriod(payout)} (ref ${reference})`
        : `Your PKR ${amount} payment for ${formatPeriod(payout)} was received (ref ${reference})`,
    data: { type: 'payout', payoutId: String(payout._id) },
  });

  return payout;
}

export async function markPayoutFailed(id: string, reason: string): Promise<IPayout> {
  const payout = await findPayoutOrThrow(id);
  if (payout.status === 'Paid') throw new PayoutError(409, 'A paid payout cannot be marked failed');

  payout.status = 'Failed';
  payout.failureReason = reason;
  await payout.save();
  return payout;
}
