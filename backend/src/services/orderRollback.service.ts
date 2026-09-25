import mongoose from 'mongoose';
import Order from '../models/order';
import Cart from '../models/cart';

/**
 * Checkout is a chain of steps — create the order, then take payment
 * (Safepay) or confirm Cash on Delivery. The order step closes the cart, so
 * if a later step fails the customer would be left with an orphaned order
 * and an empty cart. This service is the compensating action: it undoes the
 * order step by cancelling the order and re-opening the cart it came from.
 *
 * Only orders that nothing downstream has acted on can be rolled back:
 * still "Pending" (not confirmed/being prepared) and not paid.
 */

export type RollbackResult =
  | { rolledBack: true; cartRestored: boolean; order: any }
  | { rolledBack: false; reason: 'not_found' | 'not_rollbackable'; order?: any };

export async function rollbackUnpaidOrder(
  orderId: string,
  opts: { customerId?: string; reason: string },
): Promise<RollbackResult> {
  const session = await mongoose.startSession();
  try {
    let result!: RollbackResult;

    await session.withTransaction(async () => {
      const filter: Record<string, unknown> = { _id: orderId };
      if (opts.customerId) filter.customer = opts.customerId;

      const order = await Order.findOne(filter).session(session);
      if (!order) {
        result = { rolledBack: false, reason: 'not_found' };
        return;
      }
      if (order.status !== 'Pending' || order.payment.status === 'Completed') {
        result = { rolledBack: false, reason: 'not_rollbackable', order };
        return;
      }

      order.status = 'Cancelled';
      order.payment.status = 'Failed';
      order.cancellationReason = opts.reason;
      order.timeline.push({ status: 'Cancelled', timestamp: new Date(), note: opts.reason });
      await order.save({ session });

      // Re-open the source cart — unless the customer has already started a
      // new one, which we must not clobber.
      let cartRestored = false;
      if (order.cart) {
        const hasActiveCart = await Cart.exists({
          customer: order.customer,
          status: 'Active',
        }).session(session);
        if (!hasActiveCart) {
          const res = await Cart.updateOne(
            { _id: order.cart, status: 'Completed' },
            { $set: { status: 'Active', lastUpdated: new Date() } },
            { session },
          );
          cartRestored = res.modifiedCount === 1;
        }
      }

      result = { rolledBack: true, cartRestored, order };
    });

    return result;
  } finally {
    await session.endSession();
  }
}
