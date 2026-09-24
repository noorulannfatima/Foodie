import mongoose, { Document } from "mongoose";

export const REVIEW_COMMENT_MAX_LENGTH = 500;

export interface IReviewItem {
  menuItem: mongoose.Types.ObjectId; // Menu.items subdocument id
  name: string; // Dish name at the time of review, so renamed/deleted dishes still read correctly
  rating: number;
  comment?: string;
}

/**
 * One review per delivered order: a star rating for each distinct dish plus,
 * when the order had a rider, a rating for the delivery person. Reviews are
 * immutable once created — the unique index on `order` enforces "once only".
 */
export interface IReview extends Document {
  order: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  customerFirstName: string;
  restaurant: mongoose.Types.ObjectId;
  deliveryPerson?: mongoose.Types.ObjectId;
  items: IReviewItem[];
  delivery?: {
    rating: number;
    comment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RATING_RANGE_MESSAGE = "Rating must be a whole number from 1 to 5";

const ratingField = {
  type: Number,
  required: true,
  min: [1, RATING_RANGE_MESSAGE] as [number, string],
  max: [5, RATING_RANGE_MESSAGE] as [number, string],
  validate: {
    validator: (v: number) => Number.isInteger(v),
    message: RATING_RANGE_MESSAGE,
  },
};

const commentField = {
  type: String,
  trim: true,
  maxlength: [REVIEW_COMMENT_MAX_LENGTH, `Comment cannot exceed ${REVIEW_COMMENT_MAX_LENGTH} characters`],
} as const;

const reviewItemSchema = new mongoose.Schema<IReviewItem>(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: ratingField,
    comment: commentField,
  },
  { _id: false }
);

const deliveryRatingSchema = new mongoose.Schema<NonNullable<IReview["delivery"]>>(
  {
    rating: ratingField,
    comment: commentField,
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema<IReview>(
  {
    // ========== Relationships ==========
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerFirstName: {
      type: String,
      required: true,
      trim: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
    },

    // ========== Ratings ==========
    items: {
      type: [reviewItemSchema],
      validate: {
        validator: (v: IReviewItem[]) => Array.isArray(v) && v.length > 0,
        message: "At least one dish rating is required",
      },
    },

    delivery: {
      type: deliveryRatingSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// ========== Indexes ==========
// order index created by unique: true
reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ deliveryPerson: 1, createdAt: -1 });

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;
