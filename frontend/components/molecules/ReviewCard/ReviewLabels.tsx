import { createContext, useContext } from 'react';

/**
 * Fixed text inside the shared review components. Defaults to English; a role
 * layout can provide translated labels without threading props through every list.
 */
export interface ReviewLabels {
  justNow: string;
  minutesAgo: (count: number) => string;
  hoursAgo: (count: number) => string;
  daysAgo: (count: number) => string;
  /** Locale for dates older than a week; undefined uses the device default. */
  locale?: string;
  recentReviews: string;
  seeAll: string;
  noReviews: string;
  loadFailed: string;
  retry: string;
}

export const DEFAULT_REVIEW_LABELS: ReviewLabels = {
  justNow: 'Just now',
  minutesAgo: (n) => `${n}m ago`,
  hoursAgo: (n) => `${n}h ago`,
  daysAgo: (n) => `${n}d ago`,
  recentReviews: 'Recent Reviews',
  seeAll: 'See all',
  noReviews: 'No reviews yet',
  loadFailed: 'Could not load reviews',
  retry: 'Retry',
};

const ReviewLabelsContext = createContext<ReviewLabels>(DEFAULT_REVIEW_LABELS);

export const ReviewLabelsProvider = ReviewLabelsContext.Provider;

export function useReviewLabels(): ReviewLabels {
  return useContext(ReviewLabelsContext);
}
