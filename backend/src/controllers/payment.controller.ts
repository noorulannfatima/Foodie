import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/order';
import User from '../models/user';
import {
  createTracker,
  getPaymentStatus,
  parseWebhookPayload,
  verifyWebhookSignature,
} from '../services/safepay.service';

/**
 * Payment controller — handles the two payment methods supported by the app:
 *
 *   1. Safepay  — hosted-checkout flow for cards/wallets
 *   2. Cash on Delivery (COD) — no provider involved, just a status flag
 *
 * Each handler is intentionally small and delegates provider-specific work
 * to `services/safepay.service.ts`, keeping this layer focused on business
 * rules (auth, ownership checks, persistence).
 */

// ---------------------------------------------------------------------------
// POST /api/payments/safepay/initiate
// ---------------------------------------------------------------------------

/**
 * Body: { orderId: string }
 *
 * Flow:
 *   - Verify the order belongs to the authed customer and is unpaid.
 *   - Ask Safepay to create a tracker for the order's total.
 *   - Persist the tracker on the order so we can match the webhook later.
 *   - Return { tracker, checkoutUrl } so the app can open the hosted page.
 */
export async function initiateSafepayPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'A valid orderId is required' });
      return;
    }

    // Look up the order and make sure it actually belongs to this user.
    const order = await Order.findOne({ _id: orderId, customer: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Don't accept money for an order that's already paid or cancelled.
    if (order.payment.status === 'Completed') {
      res.status(409).json({ message: 'Order is already paid' });
      return;
    }
    if (order.status === 'Cancelled') {
      res.status(409).json({ message: 'Cannot pay for a cancelled order' });
      return;
    }

    // Pull lightweight customer info to display on the Safepay checkout.
    const user = await User.findById(req.user!.id).select('name email phone');

    const { tracker, checkoutUrl } = await createTracker({
      amount: order.pricing.total,
      currency: 'PKR',
      orderId: order._id.toString(),
      description: `Foodie order ${order.orderNumber}`,
      customer: {
        name: (user as any)?.name,
        email: (user as any)?.email,
        phone: (user as any)?.phone,
      },
    });

    // Save the tracker so the webhook can find this order later.
    order.payment.method = 'Safepay';
    order.payment.safepayTracker = tracker;
    order.payment.safepayState = 'TRACKER_INITIATED';
    await order.save();

    res.json({
      tracker,
      checkoutUrl,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error('[Payment] initiateSafepayPayment error:', error);
    res.status(500).json({ message: error.message || 'Failed to initiate payment' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/payments/safepay/verify/:orderId
// ---------------------------------------------------------------------------

/**
 * Called by the app right after the user returns from Safepay's hosted
 * checkout. Webhooks are usually faster, but if the network is flaky the
 * user might come back before the webhook lands — so we re-fetch the
 * authoritative state from Safepay and update the order if needed.
 */
export async function verifySafepayPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = req.params.orderId as string;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'A valid orderId is required' });
      return;
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // No tracker on the order means we never started a Safepay session for it.
    if (!order.payment.safepayTracker) {
      res.status(400).json({ message: 'No Safepay session started for this order' });
      return;
    }

    // If the webhook already settled this, just return the current state.
    if (order.payment.status === 'Completed' || order.payment.status === 'Failed') {
      res.json({ status: order.payment.status, order });
      return;
    }

    // Otherwise ask Safepay directly.
    const { state } = await getPaymentStatus(order.payment.safepayTracker);
    order.payment.safepayState = state;

    // Map Safepay's vocabulary to our Order.payment.status enum.
    if (isSuccessState(state)) {
      order.payment.status = 'Completed';
      order.payment.paidAt = new Date();
      order.status = 'Confirmed';
    } else if (isFailureState(state)) {
      order.payment.status = 'Failed';
    }

    await order.save();

    res.json({ status: order.payment.status, state, order });
  } catch (error: any) {
    console.error('[Payment] verifySafepayPayment error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify payment' });
  }
}

// ---------------------------------------------------------------------------
// POST /payments/safepay/webhook   (NO auth — signature-verified instead)
// ---------------------------------------------------------------------------

/**
 * Safepay calls this endpoint when a payment changes state. We:
 *   - Verify the HMAC-SHA256 signature on the raw body.
 *   - Look up the order by tracker (or metadata.order_id as fallback).
 *   - Update payment & order status idempotently.
 *
 * IMPORTANT: this route MUST be mounted with `express.raw({type:'*\/*'})` so
 * that `req.body` is a Buffer here — re-serialising JSON would change the
 * byte order and invalidate Safepay's signature.
 */
export async function safepayWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.header('x-sfpy-signature') || req.header('X-SFPY-Signature');
    const rawBody = req.body as Buffer;

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[Safepay] webhook signature mismatch');
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }

    // Parse the now-verified JSON safely.
    const json = JSON.parse(rawBody.toString('utf8'));
    const event = parseWebhookPayload(json);

    // Find the order by tracker first, falling back to the metadata order_id.
    let order = null;
    if (event.tracker) {
      order = await Order.findOne({ 'payment.safepayTracker': event.tracker });
    }
    if (!order && event.orderId && mongoose.Types.ObjectId.isValid(event.orderId)) {
      order = await Order.findById(event.orderId);
    }

    if (!order) {
      // Acknowledge anyway so Safepay stops retrying for an unknown order.
      console.warn('[Safepay] webhook for unknown order', event);
      res.status(200).json({ received: true, matched: false });
      return;
    }

    // Idempotency guard: if we've already marked it Completed/Failed, just ack.
    if (order.payment.status === 'Completed' || order.payment.status === 'Failed') {
      res.status(200).json({ received: true, alreadyResolved: true });
      return;
    }

    order.payment.safepayState = event.state;
    if (event.transactionReference) {
      order.payment.transactionId = event.transactionReference;
    }

    if (isSuccessState(event.state) || event.event === 'payment.captured') {
      order.payment.status = 'Completed';
      order.payment.paidAt = new Date();
      order.status = 'Confirmed';
      order.timeline.push({
        status: 'Confirmed',
        timestamp: new Date(),
        note: 'Payment confirmed via Safepay',
      });
    } else if (isFailureState(event.state) || event.event === 'payment.failed') {
      order.payment.status = 'Failed';
      order.timeline.push({
        status: order.status,
        timestamp: new Date(),
        note: 'Safepay payment failed',
      });
    }

    await order.save();
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Payment] safepayWebhook error:', error);
    // Always 200 on parse errors — Safepay retries 5xx forever.
    res.status(200).json({ received: false, error: error.message });
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/cod/confirm
// ---------------------------------------------------------------------------

/**
 * Cash on Delivery is the simplest case: no external provider, no money
 * changes hands until the rider hands over the food. We just record the
 * customer's choice on the order so the kitchen knows to expect cash, then
 * leave the payment.status as "Pending" until delivery completes.
 *
 * Body: { orderId: string }
 */
export async function confirmCashOnDelivery(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'A valid orderId is required' });
      return;
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.payment.status === 'Completed') {
      res.status(409).json({ message: 'Order is already paid' });
      return;
    }

    order.payment.method = 'Cash';
    order.payment.status = 'Pending'; // remains pending until delivery
    order.status = 'Confirmed';
    order.timeline.push({
      status: 'Confirmed',
      timestamp: new Date(),
      note: 'Cash on Delivery confirmed',
    });

    await order.save();
    res.json({ order });
  } catch (error: any) {
    console.error('[Payment] confirmCashOnDelivery error:', error);
    res.status(500).json({ message: error.message || 'Failed to confirm COD' });
  }
}

// ---------------------------------------------------------------------------
// State-mapping helpers
// ---------------------------------------------------------------------------

// Safepay uses a small set of state strings to describe a tracker's lifecycle.
// We collapse those into the binary success/failure terms our Order model uses.

function isSuccessState(state: string): boolean {
  // "TRACKER_ENDED" + a captured payment is the canonical success path; some
  // older accounts surface "PAID" / "CAPTURED" instead — accept all.
  return ['TRACKER_ENDED', 'PAID', 'CAPTURED', 'COMPLETED', 'SUCCESS'].includes(state);
}

function isFailureState(state: string): boolean {
  return ['FAILED', 'CANCELLED', 'DECLINED', 'EXPIRED', 'ERRORED'].includes(state);
}
