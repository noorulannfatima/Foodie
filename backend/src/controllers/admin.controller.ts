import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Restaurant from '../models/restaurant';
import Order from '../models/order';
import Payout from '../models/payout';
import {
  generatePayouts as generatePayoutsForPeriod,
  getUnsettledSummaries,
  markPayoutFailed,
  markPayoutPaid,
  PayoutError,
} from '../services/payout.service';
import { computeSettlement } from '../services/payoutCalculator';

const PAYOUT_STATUSES = ['Processing', 'Paid', 'Failed'];
const MAX_COMMISSION_RATE = 0.5;

function handleError(res: Response, error: unknown, context: string) {
  if (error instanceof PayoutError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  console.error(`Admin ${context} error:`, error);
  res.status(500).json({ message: 'Server error' });
}

function requireText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Sends 400/404 and returns null unless `id` names an existing restaurant. */
async function findRestaurant(id: string, res: Response) {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: 'Invalid restaurant id' });
    return null;
  }
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    res.status(404).json({ message: 'Restaurant not found' });
    return null;
  }
  return restaurant;
}

/**
 * GET /api/admin/overview
 */
export async function getOverview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [summaries, processing, paid, pendingAccounts] = await Promise.all([
      getUnsettledSummaries(),
      Payout.aggregate([
        { $match: { status: 'Processing' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$netAmount' } } },
      ]),
      // Only money Foodie sent out; negative payouts are collections, not payouts
      Payout.aggregate([
        { $match: { status: 'Paid', paidAt: { $gte: monthStart }, netAmount: { $gt: 0 } } },
        { $group: { _id: null, amount: { $sum: '$netAmount' } } },
      ]),
      Restaurant.countDocuments({ 'payoutAccount.status': 'Pending' }),
    ]);

    let unsettledNet = 0;
    let unsettledOrders = 0;
    for (const summary of summaries.values()) {
      unsettledNet += summary.netAmount;
      unsettledOrders += summary.orderCount;
    }

    res.json({
      unsettledNet: Math.round(unsettledNet * 100) / 100,
      unsettledOrders,
      processingCount: processing[0]?.count ?? 0,
      processingAmount: Math.round((processing[0]?.amount ?? 0) * 100) / 100,
      paidThisMonth: Math.round((paid[0]?.amount ?? 0) * 100) / 100,
      pendingAccounts,
    });
  } catch (error) {
    handleError(res, error, 'overview');
  }
}

/**
 * GET /api/admin/restaurants
 */
export async function getRestaurants(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [restaurants, summaries] = await Promise.all([
      Restaurant.find()
        .select('name address commissionRate payoutAccount')
        .sort({ name: 1 })
        .lean(),
      getUnsettledSummaries(),
    ]);

    res.json({
      restaurants: restaurants.map((r) => ({
        _id: String(r._id),
        name: r.name,
        address: r.address,
        commissionRate: r.commissionRate,
        payoutAccount: r.payoutAccount ?? null,
        unsettled: summaries.get(String(r._id)) ?? computeSettlement([], r.commissionRate),
      })),
    });
  } catch (error) {
    handleError(res, error, 'restaurants');
  }
}

/**
 * PATCH /api/admin/restaurants/:id/commission  { rate }
 */
export async function updateCommission(req: AuthRequest, res: Response): Promise<void> {
  try {
    const rate = req.body?.rate;
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > MAX_COMMISSION_RATE) {
      res.status(400).json({ message: 'rate must be a number between 0 and 0.5' });
      return;
    }

    const restaurant = await findRestaurant(req.params.id as string, res);
    if (!restaurant) return;

    restaurant.commissionRate = rate;
    await restaurant.save();
    res.json({ restaurant: { _id: restaurant._id, commissionRate: restaurant.commissionRate } });
  } catch (error) {
    handleError(res, error, 'commission');
  }
}

/**
 * PATCH /api/admin/restaurants/:id/payout-account  { status: "Verified" | "Rejected", reason? }
 */
export async function reviewPayoutAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status } = req.body ?? {};
    const reason = requireText(req.body?.reason);
    if (status !== 'Verified' && status !== 'Rejected') {
      res.status(400).json({ message: 'status must be Verified or Rejected' });
      return;
    }
    if (status === 'Rejected' && !reason) {
      res.status(400).json({ message: 'A reason is required to reject an account' });
      return;
    }

    const restaurant = await findRestaurant(req.params.id as string, res);
    if (!restaurant) return;
    if (!restaurant.payoutAccount) {
      res.status(400).json({ message: 'This restaurant has not added a payout account' });
      return;
    }

    restaurant.payoutAccount.status = status;
    restaurant.payoutAccount.rejectionReason = status === 'Rejected' ? reason! : undefined;
    await restaurant.save();
    res.json({ payoutAccount: restaurant.payoutAccount });
  } catch (error) {
    handleError(res, error, 'payout account review');
  }
}

/**
 * POST /api/admin/payouts/generate  { periodEnd? }
 */
export async function generatePayouts(req: AuthRequest, res: Response): Promise<void> {
  try {
    let periodEnd = new Date();
    if (req.body?.periodEnd !== undefined) {
      periodEnd = new Date(req.body.periodEnd);
      if (Number.isNaN(periodEnd.getTime())) {
        res.status(400).json({ message: 'periodEnd must be a valid date' });
        return;
      }
    }

    const created = await generatePayoutsForPeriod(periodEnd);
    res.status(201).json({ created });
  } catch (error) {
    handleError(res, error, 'generate payouts');
  }
}

/**
 * GET /api/admin/payouts?status=&restaurant=
 */
export async function getPayouts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const filter: Record<string, unknown> = {};
    const { status, restaurant } = req.query;
    if (typeof status === 'string' && PAYOUT_STATUSES.includes(status)) filter.status = status;
    if (typeof restaurant === 'string') {
      if (!mongoose.isValidObjectId(restaurant)) {
        res.status(400).json({ message: 'Invalid restaurant id' });
        return;
      }
      filter.restaurant = restaurant;
    }

    const payouts = await Payout.find(filter)
      .select('-orders')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ payouts });
  } catch (error) {
    handleError(res, error, 'list payouts');
  }
}

/**
 * GET /api/admin/payouts/:id
 */
export async function getPayout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid payout id' });
      return;
    }

    const payout = await Payout.findById(id).populate('restaurant', 'name').lean();
    if (!payout) {
      res.status(404).json({ message: 'Payout not found' });
      return;
    }

    const orders = await Order.find({ _id: { $in: payout.orders } })
      .select('orderNumber pricing.subtotal payment.method actualDeliveryTime updatedAt')
      .sort({ actualDeliveryTime: -1 })
      .lean();

    res.json({
      payout,
      orders: orders.map((o) => ({
        _id: String(o._id),
        orderNumber: o.orderNumber,
        subtotal: o.pricing.subtotal,
        method: o.payment.method,
        deliveredAt: o.actualDeliveryTime ?? o.updatedAt,
      })),
    });
  } catch (error) {
    handleError(res, error, 'payout detail');
  }
}

/**
 * PATCH /api/admin/payouts/:id/paid  { reference }
 */
export async function markPaid(req: AuthRequest, res: Response): Promise<void> {
  try {
    const reference = requireText(req.body?.reference);
    if (!reference) {
      res.status(400).json({ message: 'A transaction reference is required' });
      return;
    }
    const payout = await markPayoutPaid(req.params.id as string, reference);
    res.json({ payout });
  } catch (error) {
    handleError(res, error, 'mark paid');
  }
}

/**
 * PATCH /api/admin/payouts/:id/failed  { reason }
 */
export async function markFailed(req: AuthRequest, res: Response): Promise<void> {
  try {
    const reason = requireText(req.body?.reason);
    if (!reason) {
      res.status(400).json({ message: 'A failure reason is required' });
      return;
    }
    const payout = await markPayoutFailed(req.params.id as string, reason);
    res.json({ payout });
  } catch (error) {
    handleError(res, error, 'mark failed');
  }
}
