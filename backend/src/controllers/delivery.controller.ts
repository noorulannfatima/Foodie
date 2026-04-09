import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import DeliveryPerson from '../models/deliveryperson';
import Order from '../models/order';

function estDriverPayout(pricing: { deliveryFee: number; tip: number }): number {
  const raw = pricing.deliveryFee * 0.6 + pricing.tip * 0.85;
  return Math.round(raw * 100) / 100;
}

function serializeOrder(o: any) {
  const restaurant = o.restaurant;
  const street = restaurant?.address?.street ?? '';
  const city = restaurant?.address?.city ?? '';
  const addressLine = [street, city].filter(Boolean).join(', ') || 'Address on file';
  const itemsSummary = o.items
    .map((it: { name: string; quantity: number }) => `${it.quantity}x ${it.name}`)
    .join(', ');
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status,
    itemsSummary,
    items: o.items,
    estimatedPreparationTime: o.estimatedPreparationTime,
    pricing: o.pricing,
    estPayout: estDriverPayout(o.pricing),
    restaurant: restaurant
      ? {
          id: String(restaurant._id),
          name: restaurant.name,
          image: Array.isArray(restaurant.image) ? restaurant.image[0] : restaurant.logo,
          addressLine,
        }
      : null,
    deliveryAddress: o.deliveryAddress,
  };
}

/**
 * GET /api/delivery/me
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const dp = await DeliveryPerson.findById(req.user!.id).select('-password').lean();
    if (!dp) {
      res.status(404).json({ message: 'Delivery profile not found' });
      return;
    }
    const stats = dp.stats as { totalDeliveries?: number; completedDeliveries?: number };
    const completionRate =
      stats.totalDeliveries && stats.totalDeliveries > 0
        ? Math.round(((stats.completedDeliveries ?? 0) / stats.totalDeliveries) * 100)
        : 100;
    res.json({
      profile: {
        ...dp,
        completionRate,
        tierLabel: (stats.totalDeliveries ?? 0) >= 500 ? 'MESSENGER TIER' : 'COURIER',
      },
    });
  } catch (e) {
    console.error('getMe delivery:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PATCH /api/delivery/online
 * Body: { isOnline: boolean }
 */
export async function patchOnline(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { isOnline } = req.body as { isOnline?: boolean };
    if (typeof isOnline !== 'boolean') {
      res.status(400).json({ message: 'isOnline boolean required' });
      return;
    }
    const dp = await DeliveryPerson.findByIdAndUpdate(
      req.user!.id,
      {
        $set: {
          isOnline,
          lastActiveAt: new Date(),
        },
      },
      { new: true },
    ).select('-password');
    if (!dp) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json({ isOnline: dp.isOnline });
  } catch (e) {
    console.error('patchOnline:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/delivery/orders/active
 * Current assignment (pickup / en route).
 */
export async function getActiveOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const uid = new mongoose.Types.ObjectId(req.user!.id);
    const order = await Order.findOne({
      deliveryPerson: uid,
      status: {
        $in: ['Confirmed', 'Preparing', 'Ready', 'PickedUp', 'OutForDelivery'],
      },
    })
      .populate('restaurant', 'name image logo address')
      .sort({ updatedAt: -1 })
      .lean();

    if (!order) {
      res.json({ order: null });
      return;
    }
    res.json({ order: serializeOrder(order) });
  } catch (e) {
    console.error('getActiveOrder:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/delivery/orders/requests
 * Unassigned orders available to accept.
 */
export async function getOrderRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orders = await Order.find({
      $or: [{ deliveryPerson: null }, { deliveryPerson: { $exists: false } }],
      status: { $in: ['Confirmed', 'Ready'] },
    })
      .populate('restaurant', 'name image logo address estimatedDeliveryTime')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const list = orders.map((o: any) => {
      const base = serializeOrder(o);
      const miles = 0.5 + Math.random() * 3; // placeholder until distance service
      return {
        ...base,
        milesAway: Math.round(miles * 10) / 10,
        prepMinutes: o.estimatedPreparationTime ?? 15,
        tag: o.status === 'Ready' ? ('HOT_ORDER' as const) : undefined,
      };
    });
    res.json({ orders: list });
  } catch (e) {
    console.error('getOrderRequests:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/delivery/orders/history
 */
export async function getOrderHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const uid = new mongoose.Types.ObjectId(req.user!.id);
    const orders = await Order.find({
      deliveryPerson: uid,
      status: 'Delivered',
    })
      .populate('restaurant', 'name image logo')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const list = orders.map((o: any) => ({
      ...serializeOrder(o),
      completedAt: o.actualDeliveryTime ?? o.updatedAt,
      driverEarnings: estDriverPayout(o.pricing),
    }));
    res.json({ orders: list });
  } catch (e) {
    console.error('getOrderHistory:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/delivery/orders/:id/accept
 */
export async function acceptOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      _id: id,
      $or: [{ deliveryPerson: null }, { deliveryPerson: { $exists: false } }],
      status: { $in: ['Confirmed', 'Ready'] },
    });
    if (!order) {
      res.status(400).json({ message: 'Order unavailable' });
      return;
    }
    await order.assignDeliveryPerson(req.user!.id);
    res.json({ ok: true, orderId: String(order._id) });
  } catch (e) {
    console.error('acceptOrder:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

const NEXT_STATUS_FROM: Record<string, string[]> = {
  PickedUp: ['Confirmed', 'Preparing', 'Ready'],
  OutForDelivery: ['PickedUp'],
  Delivered: ['OutForDelivery'],
};

/**
 * PATCH /api/delivery/orders/:id/status
 * Body: { status: 'PickedUp' | 'OutForDelivery' | 'Delivered' }
 */
export async function patchOrderStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    const allowed = ['PickedUp', 'OutForDelivery', 'Delivered'] as const;
    if (!status || !allowed.includes(status as (typeof allowed)[number])) {
      res.status(400).json({ message: 'status must be PickedUp, OutForDelivery, or Delivered' });
      return;
    }

    const order = await Order.findOne({
      _id: id,
      deliveryPerson: new mongoose.Types.ObjectId(req.user!.id),
    });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const prev = order.status;
    const mustBe = NEXT_STATUS_FROM[status];
    if (!mustBe.includes(prev)) {
      res.status(400).json({ message: `Cannot move order to ${status} from ${prev}` });
      return;
    }

    if (status === 'Delivered') {
      const payout = estDriverPayout(order.pricing);
      await order.updateStatus('Delivered', 'Delivered by courier');
      let dp = await DeliveryPerson.findById(req.user!.id);
      if (dp) {
        await (dp as any).updateEarnings(payout);
        dp = await DeliveryPerson.findById(req.user!.id);
        if (dp) {
          await (dp as any).addDelivery({
            order: order._id,
            restaurant: order.restaurant,
            customer: order.customer,
            earnings: payout,
            distance: 1,
            duration: Math.max(
              1,
              Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000),
            ),
            status: 'delivered',
            deliveryTime: new Date(),
          });
        }
      }
    } else {
      const note =
        status === 'OutForDelivery' ? 'Courier en route to customer' : 'Picked up from restaurant';
      await order.updateStatus(status, note);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('patchOrderStatus:', e);
    res.status(500).json({ message: 'Server error' });
  }
}
