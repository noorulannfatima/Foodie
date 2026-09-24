/** Shapes shared by the review endpoints (customer submit, restaurant and delivery lists). */

export type Pagination = { page: number; limit: number; total: number; pages: number };

export type SubmitReviewBody = {
  items: Array<{ menuItem: string; rating: number; comment?: string }>;
  delivery?: { rating: number; comment?: string };
};

export type RestaurantReview = {
  id: string;
  dishName: string;
  rating: number;
  comment?: string;
  customerFirstName: string;
  createdAt: string;
};

export type RestaurantReviewsResponse = {
  summary: { averageRating: number; totalReviews: number };
  reviews: RestaurantReview[];
  pagination: Pagination;
};

export type DeliveryReview = {
  id: string;
  rating: number;
  comment?: string;
  customerFirstName: string;
  orderNumber: string | null;
  createdAt: string;
};

export type DeliveryReviewsResponse = {
  summary: { averageRating: number; totalRatings: number };
  reviews: DeliveryReview[];
  pagination: Pagination;
};
