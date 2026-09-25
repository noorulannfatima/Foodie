import mongoose from 'mongoose';
import Review from '../models/review';

/**
 * Reviews of a single dish. A review document covers a whole order, so each
 * query unwinds its `items` and keeps the entries for this dish. "Written"
 * reviews are the ones with a comment; ratings without one only count
 * towards the star breakdown.
 */

export interface ItemReview {
  id: string;
  customerFirstName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type RatingBreakdown = Record<1 | 2 | 3 | 4 | 5, number>;

function dishEntries(restaurantId: string, menuItemId: string) {
  const restaurant = new mongoose.Types.ObjectId(restaurantId);
  const menuItem = new mongoose.Types.ObjectId(menuItemId);
  return [
    { $match: { restaurant, 'items.menuItem': menuItem } },
    { $unwind: '$items' },
    { $match: { 'items.menuItem': menuItem } },
  ];
}

const WRITTEN = { $match: { 'items.comment': { $type: 'string', $ne: '' } } };
const NEWEST_FIRST = { $sort: { createdAt: -1 as const, _id: -1 as const } };
const AS_ITEM_REVIEW = {
  $project: {
    _id: 0,
    id: { $toString: '$_id' },
    customerFirstName: 1,
    rating: '$items.rating',
    comment: '$items.comment',
    createdAt: 1,
  },
};

/** Star breakdown, number of written reviews and the newest few of them. */
export async function itemReviewSummary(restaurantId: string, menuItemId: string, latestCount = 3) {
  const [result] = await Review.aggregate([
    ...dishEntries(restaurantId, menuItemId),
    {
      $facet: {
        breakdown: [{ $group: { _id: '$items.rating', count: { $sum: 1 } } }],
        written: [WRITTEN, { $count: 'count' }],
        latest: [WRITTEN, NEWEST_FIRST, { $limit: latestCount }, AS_ITEM_REVIEW],
      },
    },
  ]);

  const breakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const { _id, count } of result?.breakdown ?? []) {
    if (_id in breakdown) breakdown[_id as keyof RatingBreakdown] = count;
  }
  return {
    breakdown,
    writtenCount: (result?.written[0]?.count as number) ?? 0,
    latest: (result?.latest ?? []) as ItemReview[],
  };
}

/** One page of written reviews, newest first, optionally only one star rating. */
export async function listItemReviews(
  restaurantId: string,
  menuItemId: string,
  opts: { rating?: number; skip: number; limit: number },
) {
  const [result] = await Review.aggregate([
    ...dishEntries(restaurantId, menuItemId),
    WRITTEN,
    ...(opts.rating ? [{ $match: { 'items.rating': opts.rating } }] : []),
    NEWEST_FIRST,
    {
      $facet: {
        reviews: [{ $skip: opts.skip }, { $limit: opts.limit }, AS_ITEM_REVIEW],
        total: [{ $count: 'count' }],
      },
    },
  ]);
  return {
    reviews: (result?.reviews ?? []) as ItemReview[],
    total: (result?.total[0]?.count as number) ?? 0,
  };
}
