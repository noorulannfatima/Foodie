import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/order';
import User from '../models/user';
import Restaurant from '../models/restaurant';
import DeliveryPerson from '../models/deliveryperson';
import Review, { REVIEW_COMMENT_MAX_LENGTH } from '../models/review';
import { notifyRestaurant } from '../services/push.service';
import {
  recalculateDeliveryRating,
  recalculateRestaurantRatings,
  roundedAverage,
} from '../services/rating.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Thrown while parsing the request body; turned into a 400 response. */
class ReviewInputError extends Error {}

function parseRating(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new ReviewInputError(`${label} rating must be a whole number from 1 to 5`);
  }
  return value;
}

/** Trims the comment; empty comments are dropped rather than stored. */
function parseComment(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new ReviewInputError(`${label} comment must be text`);
  }
  const trimmed = value.trim();
  if (trimmed.length > REVIEW_COMMENT_MAX_LENGTH) {
    throw new ReviewInputError(
      `${label} comment cannot exceed ${REVIEW_COMMENT_MAX_LENGTH} characters`,
    );
  }
  return trimmed || undefined;
}

/** Reads `?page` and `?limit` (limit clamped to 1–50). */
function parsePagination(query: AuthRequest['query']) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function firstName(fullName?: string): string {
  return fullName?.trim().split(/\s+/)[0] || 'Customer';
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ========== Customer ==========

/**
 * POST /api/customer/orders/:id/review
 * Body: {
 *   items: [{ menuItem: string, rating: 1-5, comment?: string }],  // every distinct dish, once
 *   delivery?: { rating: 1-5, comment?: string }                   // required iff the order had a rider
 * }
 *
 * One review per delivered order; it can't be edited afterwards.
 */
export async function submitOrderReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'Invalid order id' });
      return;
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.status !== 'Delivered') {
      res.status(409).json({ message: 'Order must be delivered before it can be reviewed' });
      return;
    }

    // ----- Validate body against the order ---------------------------------
    // The same dish ordered twice (e.g. with different customizations) is rated once
    const dishNames = new Map<string, string>();
    for (const line of order.items) {
      const id = line.menuItem.toString();
      if (!dishNames.has(id)) dishNames.set(id, line.name);
    }

    const body = req.body ?? {};
    let items: Array<{ menuItem: mongoose.Types.ObjectId; name: string; rating: number; comment?: string }>;
    let delivery: { rating: number; comment?: string } | undefined;

    try {
      if (!Array.isArray(body.items)) {
        throw new ReviewInputError('items must be a list of dish ratings');
      }

      const seen = new Set<string>();
      items = body.items.map((entry: any) => {
        const id = String(entry?.menuItem ?? '');
        const name = dishNames.get(id);
        if (!name) throw new ReviewInputError('Review includes a dish that is not in this order');
        if (seen.has(id)) throw new ReviewInputError(`${name} is rated more than once`);
        seen.add(id);
        return {
          menuItem: new mongoose.Types.ObjectId(id),
          name,
          rating: parseRating(entry.rating, name),
          comment: parseComment(entry.comment, name),
        };
      });

      const missing = [...dishNames].filter(([id]) => !seen.has(id)).map(([, name]) => name);
      if (missing.length > 0) {
        throw new ReviewInputError(`Please rate every dish: ${missing.join(', ')}`);
      }

      if (order.deliveryPerson) {
        if (!body.delivery) throw new ReviewInputError('Please rate your delivery');
        delivery = {
          rating: parseRating(body.delivery.rating, 'Delivery'),
          comment: parseComment(body.delivery.comment, 'Delivery'),
        };
      } else if (body.delivery !== undefined && body.delivery !== null) {
        throw new ReviewInputError('This order had no delivery person to rate');
      }
    } catch (error) {
      if (error instanceof ReviewInputError) {
        res.status(400).json({ message: error.message });
        return;
      }
      throw error;
    }

    // ----- Persist ----------------------------------------------------------
    const customer = await User.findById(req.user!.id).select('name').lean();

    let review;
    try {
      review = await Review.create({
        order: order._id,
        customer: order.customer,
        customerFirstName: firstName(customer?.name),
        restaurant: order.restaurant,
        deliveryPerson: order.deliveryPerson,
        items,
        delivery,
      });
    } catch (error: any) {
      // The unique index on `order` is what makes a review "once only",
      // including when two submits race each other
      if (error?.code === 11000) {
        res.status(409).json({ message: 'Order already reviewed' });
        return;
      }
      throw error;
    }

    // The review is saved; a failed aggregate refresh is logged, not surfaced,
    // and is corrected by the next review (or scripts/recalculateRatings.ts)
    try {
      await Promise.all([
        recalculateRestaurantRatings(order.restaurant),
        order.deliveryPerson ? recalculateDeliveryRating(order.deliveryPerson) : null,
      ]);
    } catch (error) {
      console.error('Rating recalculation error:', error);
    }

    const average = roundedAverage(
      items.reduce((sum, item) => sum + item.rating, 0),
      items.length,
    );
    const firstComment = items.find((item) => item.comment)?.comment;
    void notifyRestaurant(order.restaurant, 'reviews', {
      title: `New ${average}-star review`,
      body: firstComment
        ? `"${truncate(firstComment, 100)}"`
        : `Order #${order.orderNumber}: ${items.length} dish${items.length === 1 ? '' : 'es'} rated`,
      data: { type: 'new_review', orderId: order._id.toString() },
    });

    res.status(201).json({ review });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }
    console.error('Submit review error:', error);
    res.status(500).json({ message: 'Server error submitting review' });
  }
}

// ========== Restaurant ==========

/**
 * GET /restaurant/reviews?page=1&limit=20
 * The restaurant's dish reviews, newest first, one row per rated dish.
 */
export async function getRestaurantReviews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const restaurant = await Restaurant.findById(req.user!.id).select('averageRating totalReviews');
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const [result] = await Review.aggregate([
      { $match: { restaurant: restaurant._id } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $unwind: '$items' },
      {
        $facet: {
          reviews: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                id: { $concat: [{ $toString: '$_id' }, ':', { $toString: '$items.menuItem' }] },
                dishName: '$items.name',
                rating: '$items.rating',
                comment: '$items.comment',
                customerFirstName: 1,
                createdAt: 1,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const total = result?.total[0]?.count ?? 0;

    res.json({
      summary: {
        averageRating: restaurant.averageRating,
        totalReviews: restaurant.totalReviews,
      },
      reviews: result?.reviews ?? [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get restaurant reviews error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
}

// ========== Delivery ==========

/**
 * GET /api/delivery/reviews?page=1&limit=20
 * Ratings customers gave this delivery person, newest first.
 */
export async function getDeliveryReviews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const deliveryPerson = await DeliveryPerson.findById(req.user!.id).select('stats');
    if (!deliveryPerson) {
      res.status(404).json({ message: 'Delivery profile not found' });
      return;
    }

    const query = { deliveryPerson: deliveryPerson._id, 'delivery.rating': { $exists: true } };
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select('delivery customerFirstName createdAt order')
        .populate<{ order: { orderNumber: string } | null }>('order', 'orderNumber')
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      summary: {
        averageRating: deliveryPerson.stats.averageRating,
        totalRatings: deliveryPerson.stats.totalRatings,
      },
      reviews: reviews.map((review) => ({
        id: String(review._id),
        rating: review.delivery!.rating,
        comment: review.delivery!.comment,
        customerFirstName: review.customerFirstName,
        orderNumber: review.order?.orderNumber ?? null,
        createdAt: review.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get delivery reviews error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
}
