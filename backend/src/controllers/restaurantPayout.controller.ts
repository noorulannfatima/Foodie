import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Restaurant, {
  IBAN_REGEX,
  IPayoutAccount,
  PayoutMethod,
  WALLET_MOBILE_REGEX,
} from '../models/restaurant';
import Payout from '../models/payout';
import { getPayoutOrderRows, getUnsettledSummaries } from '../services/payout.service';
import { computeSettlement, getPaymentFeeRate } from '../services/payoutCalculator';

const PAYOUT_METHODS: PayoutMethod[] = ['Bank', 'JazzCash', 'Easypaisa'];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function serverError(res: Response, error: unknown, context: string) {
  console.error(`Restaurant payouts ${context} error:`, error);
  res.status(500).json({ message: 'Server error' });
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * GET /restaurant/payouts/summary
 *
 * Everything the Payouts & Billing screen needs up front: the live unsettled
 * balance, what's already queued for payout, the last payout, and the account.
 */
export async function getPayoutSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const restaurant = await Restaurant.findById(req.user!.id)
      .select('commissionRate payoutAccount')
      .lean();
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const [summaries, processing, lastPaid] = await Promise.all([
      getUnsettledSummaries([restaurant._id as mongoose.Types.ObjectId]),
      Payout.aggregate([
        { $match: { restaurant: restaurant._id, status: 'Processing' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$netAmount' } } },
      ]),
      Payout.findOne({ restaurant: restaurant._id, status: 'Paid' })
        .sort({ paidAt: -1 })
        .select('netAmount paidAt reference periodStart periodEnd')
        .lean(),
    ]);

    res.json({
      commissionRate: restaurant.commissionRate,
      paymentFeeRate: getPaymentFeeRate(),
      unsettled:
        summaries.get(String(restaurant._id)) ?? computeSettlement([], restaurant.commissionRate),
      processing: {
        count: processing[0]?.count ?? 0,
        amount: Math.round((processing[0]?.amount ?? 0) * 100) / 100,
      },
      lastPaid: lastPaid ?? null,
      payoutAccount: restaurant.payoutAccount ?? null,
    });
  } catch (error) {
    serverError(res, error, 'summary');
  }
}

/**
 * GET /restaurant/payouts?page=&limit=
 */
export async function getPayoutHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_PAGE_SIZE)
    );

    // Fetch one extra to know whether another page exists
    const payouts = await Payout.find({ restaurant: req.user!.id })
      .select('-orders')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1)
      .lean();

    res.json({
      payouts: payouts.slice(0, limit),
      page,
      hasMore: payouts.length > limit,
    });
  } catch (error) {
    serverError(res, error, 'history');
  }
}

/**
 * GET /restaurant/payouts/:id
 */
export async function getPayoutDetail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid payout id' });
      return;
    }

    // Scoped to the signed-in restaurant: another restaurant's payout is a 404
    const payout = await Payout.findOne({ _id: id, restaurant: req.user!.id }).lean();
    if (!payout) {
      res.status(404).json({ message: 'Payout not found' });
      return;
    }

    res.json({ payout, orders: await getPayoutOrderRows(payout.orders) });
  } catch (error) {
    serverError(res, error, 'detail');
  }
}

/**
 * PUT /restaurant/payouts/account
 * { method, accountTitle, bankName?, iban?, mobileNumber?, currentPassword }
 *
 * Requires the account password, since changing where money goes is the
 * obvious target for someone holding a stolen session. Any change resets the
 * account to Pending until an admin verifies it again.
 */
export async function updatePayoutAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = req.body ?? {};
    const method = body.method as PayoutMethod;
    const accountTitle = text(body.accountTitle);
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';

    if (!PAYOUT_METHODS.includes(method)) {
      res.status(400).json({ message: 'method must be Bank, JazzCash or Easypaisa' });
      return;
    }
    if (!accountTitle) {
      res.status(400).json({ message: 'Account title is required' });
      return;
    }

    const account: IPayoutAccount = { method, accountTitle, status: 'Pending', updatedAt: new Date() };
    if (method === 'Bank') {
      const bankName = text(body.bankName);
      const iban = text(body.iban).replace(/\s+/g, '').toUpperCase();
      if (!bankName) {
        res.status(400).json({ message: 'Bank name is required' });
        return;
      }
      if (!IBAN_REGEX.test(iban)) {
        res.status(400).json({ message: 'Enter a valid IBAN (PK followed by 22 characters)' });
        return;
      }
      Object.assign(account, { bankName, iban });
    } else {
      const mobileNumber = text(body.mobileNumber).replace(/[\s-]/g, '');
      if (!WALLET_MOBILE_REGEX.test(mobileNumber)) {
        res.status(400).json({ message: 'Enter a valid mobile number like 03XXXXXXXXX' });
        return;
      }
      account.mobileNumber = mobileNumber;
    }

    if (!currentPassword) {
      res.status(400).json({ message: 'Enter your password to change payout details' });
      return;
    }
    const restaurant = await Restaurant.findById(req.user!.id).select('+password');
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    if (!(await restaurant.comparePassword(currentPassword))) {
      res.status(400).json({ message: 'Password is incorrect' });
      return;
    }

    restaurant.payoutAccount = account;
    await restaurant.save();
    res.json({ payoutAccount: restaurant.payoutAccount });
  } catch (error) {
    serverError(res, error, 'account update');
  }
}
