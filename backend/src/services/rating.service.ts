/**
 * Keeps the denormalised rating aggregates in sync with the Review collection.
 *
 * Reviews are the source of truth. Instead of incrementing counters on every
 * submit (which drifts if a write fails halfway), each function recomputes the
 * aggregates for one restaurant or delivery person from its reviews. Reviews
 * are written rarely and the queries are index-backed, so this stays cheap,
 * and any drift heals itself on the next review.
 */
import mongoose from 'mongoose';
import Review from '../models/review';
import Menu from '../models/menu';
import Restaurant from '../models/restaurant';
import DeliveryPerson from '../models/deliveryperson';

type Id = mongoose.Types.ObjectId | string;

/** Average rounded to one decimal, or 0 when there is nothing to average. */
export function roundedAverage(sum: number, count: number): number {
  return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
}

/**
 * Recomputes every dish's `ratingSum`/`ratingCount` on the restaurant's menu,
 * and the restaurant's `averageRating`/`totalReviews` (the mean over all of its
 * dish ratings).
 */
export async function recalculateRestaurantRatings(restaurantId: Id): Promise<void> {
  const restaurant = new mongoose.Types.ObjectId(String(restaurantId));

  const perDish: Array<{ _id: mongoose.Types.ObjectId; sum: number; count: number }> =
    await Review.aggregate([
      { $match: { restaurant } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          sum: { $sum: '$items.rating' },
          count: { $sum: 1 },
        },
      },
    ]);

  const menu = await Menu.findOne({ restaurant }).select('items._id');
  if (menu) {
    const byDish = new Map(perDish.map((d) => [d._id.toString(), d]));
    // Positional updates rather than menu.save(), so a concurrent menu edit by
    // the restaurant is never overwritten by this recalculation.
    const ops = menu.items.map((item) => {
      const stats = byDish.get(String(item._id));
      return {
        updateOne: {
          filter: { _id: menu._id, 'items._id': item._id },
          update: {
            $set: {
              'items.$.ratingSum': stats?.sum ?? 0,
              'items.$.ratingCount': stats?.count ?? 0,
            },
          },
        },
      };
    });
    if (ops.length > 0) await Menu.bulkWrite(ops);
  }

  // Includes ratings for dishes that were later deleted from the menu
  const total = perDish.reduce(
    (acc, d) => ({ sum: acc.sum + d.sum, count: acc.count + d.count }),
    { sum: 0, count: 0 },
  );
  await Restaurant.updateOne(
    { _id: restaurant },
    { $set: { averageRating: roundedAverage(total.sum, total.count), totalReviews: total.count } },
  );
}

/** Recomputes a delivery person's `stats.averageRating`/`stats.totalRatings`. */
export async function recalculateDeliveryRating(deliveryPersonId: Id): Promise<void> {
  const deliveryPerson = new mongoose.Types.ObjectId(String(deliveryPersonId));

  const [stats] = await Review.aggregate([
    { $match: { deliveryPerson, 'delivery.rating': { $exists: true } } },
    { $group: { _id: null, sum: { $sum: '$delivery.rating' }, count: { $sum: 1 } } },
  ]);

  await DeliveryPerson.updateOne(
    { _id: deliveryPerson },
    {
      $set: {
        'stats.averageRating': roundedAverage(stats?.sum ?? 0, stats?.count ?? 0),
        'stats.totalRatings': stats?.count ?? 0,
      },
    },
  );
}
