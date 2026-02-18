import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IRestaurant extends Document {
  // Basic Information
  name: string;
  email: string;
  password: string;
  description: string;
  phone: string;
  
  // Location & Address
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  
  // Restaurant Details
  cuisineTypes: string[];
  image: string[];
  logo?: string;
  
  // Ratings & Reviews
  averageRating: number;
  totalReviews: number;
  reviews: Array<{
    _id?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    response?: string;
    images?: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  
  // Operating Information
  operatingHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  
  // Delivery & Payment Options
  deliveryOptions: Array<"Delivery" | "Pickup" | "Dine-in">;
  paymentMethods: Array<"Cash" | "Card" | "Wallet" | "Online">;
  
  // Delivery Settings
  deliveryRadius: number; // in kilometers
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: number; // in minutes
  
  // Business Metrics
  totalOrders: number;
  totalRevenue: number;
  
  // Restaurant Status
  isActive: boolean;
  isVerified: boolean;
  isPremium: boolean;
  isBusy: boolean; // Temporarily not accepting orders
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  addReview(reviewData: any): Promise<IRestaurant>;
  respondToReview(reviewId: string, response: string): Promise<IRestaurant>;
  calculateAverageRating(): Promise<void>;
  isCurrentlyOpen(): boolean;
  canDeliver(distance: number): boolean;
}

// Restaurant Schema Definition
const restaurantSchema = new mongoose.Schema<IRestaurant>(
  {
    // ========== Basic Information ==========
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      minlength: [3, "Restaurant name must be at least 3 characters"],
      maxlength: [100, "Restaurant name cannot exceed 100 characters"],
    },
    
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email address",
      ],
    },
    
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    
    description: {
      type: String,
      required: [true, "Restaurant description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\d\s\+\-\(\)]+$/, "Please provide a valid phone number"],
    },
    
    // ========== Location & Address ==========
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, "Zip code is required"],
        trim: true,
      },
      country: {
        type: String,
        required: true,
        default: "Pakistan",
        trim: true,
      },
    },
    
    coordinates: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
        min: -180,
        max: 180,
      },
    },
    
    // ========== Restaurant Details ==========
    cuisineTypes: {
      type: [String],
      required: [true, "At least one cuisine type is required"],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "Restaurant must have at least one cuisine type",
      },
    },
    
    image: {
      type: [String],
      default: [],
    },
    
    logo: {
      type: String,
      default: null,
    },
    
    // ========== Ratings & Reviews ==========
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: [true, "Rating is required"],
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        response: {
          type: String,
          trim: true,
          maxlength: [300, "Response cannot exceed 300 characters"],
        },
        images: {
          type: [String],
          default: [],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // ========== Operating Information ==========
    operatingHours: {
      monday: {
        open: { type: String, default: "09:00" },
        close: { type: String, default: "22:00" },
        isClosed: { type: Boolean, default: false },
      },
      tuesday: {
        open: { type: String, default: "09:00" },
        close: { type: String, default: "22:00" },
        isClosed: { type: Boolean, default: false },
      },
      wednesday: {
        open: { type: String, default: "09:00" },
        close: { type: String, default: "22:00" },
        isClosed: { type: Boolean, default: false },
      },
      thursday: {
        open: { type: String, default: "09:00" },
        close: { type: String, default: "22:00" },
        isClosed: { type: Boolean, default: false },
      },
      friday: {
        open: { type: String, default: "09:00" },
        close: { type: String, default: "23:00" },
        isClosed: { type: Boolean, default: false },
      },
      saturday: {
        open: { type: String, default: "10:00" },
        close: { type: String, default: "23:00" },
        isClosed: { type: Boolean, default: false },
      },
      sunday: {
        open: { type: String, default: "10:00" },
        close: { type: String, default: "22:00" },
        isClosed: { type: Boolean, default: false },
      },
    },
    
    // ========== Delivery & Payment Options ==========
    deliveryOptions: {
      type: [String],
      enum: ["Delivery", "Pickup", "Dine-in"],
      default: ["Delivery"],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one delivery option is required",
      },
    },
    
    paymentMethods: {
      type: [String],
      enum: ["Cash", "Card", "Wallet", "Online"],
      default: ["Cash", "Card"],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one payment method is required",
      },
    },
    
    // ========== Delivery Settings ==========
    deliveryRadius: {
      type: Number,
      default: 5,
      min: [1, "Delivery radius must be at least 1 km"],
      max: [50, "Delivery radius cannot exceed 50 km"],
    },
    
    minimumOrder: {
      type: Number,
      default: 100,
      min: 0,
    },
    
    deliveryFee: {
      type: Number,
      default: 50,
      min: 0,
    },
    
    estimatedDeliveryTime: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },
    
    // ========== Business Metrics ==========
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ========== Restaurant Status ==========
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    isPremium: {
      type: Boolean,
      default: false,
    },
    
    isBusy: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== Indexes for Performance ==========
restaurantSchema.index({ email: 1 });
restaurantSchema.index({ "address.city": 1 });
restaurantSchema.index({ "address.zipCode": 1 });
restaurantSchema.index({ cuisineTypes: 1 });
restaurantSchema.index({ averageRating: -1 });
restaurantSchema.index({ isActive: 1, isVerified: 1 });
restaurantSchema.index({ coordinates: "2dsphere" }); // For geospatial queries

// ========== Pre-Save Middleware ==========

// Hash password before saving
restaurantSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update review count when reviews change
restaurantSchema.pre("save", function () {
  if (this.isModified("reviews")) {
    this.totalReviews = this.reviews.length;
  }
});

// ========== Instance Methods ==========

/**
 * Compare provided password with hashed password
 */
restaurantSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

/**
 * Add a new review
 */
restaurantSchema.methods.addReview = async function (
  reviewData: any
): Promise<IRestaurant> {
  // Check if user already reviewed
  const existingReview = this.reviews.find(
    (review: any) => review.user.toString() === reviewData.user.toString()
  );
  
  if (existingReview) {
    // Update existing review
    existingReview.rating = reviewData.rating;
    existingReview.comment = reviewData.comment;
    existingReview.images = reviewData.images || [];
    existingReview.updatedAt = new Date();
  } else {
    // Add new review
    this.reviews.push({
      ...reviewData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  await this.calculateAverageRating();
  return await (this as any).save();
};

/**
 * Respond to a review
 */
restaurantSchema.methods.respondToReview = async function (
  reviewId: string,
  response: string
): Promise<IRestaurant> {
  const review = this.reviews.find(
    (r: any) => r._id.toString() === reviewId
  );
  
  if (!review) {
    throw new Error("Review not found");
  }
  
  review.response = response;
  review.updatedAt = new Date();
  
  return await (this as any).save();
};

/**
 * Calculate average rating
 */
restaurantSchema.methods.calculateAverageRating = async function (): Promise<void> {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce(
    (sum: number, review: any) => sum + review.rating,
    0
  );
  
  this.averageRating = Math.round((totalRating / this.reviews.length) * 10) / 10;
};

/**
 * Check if restaurant is currently open
 */
restaurantSchema.methods.isCurrentlyOpen = function (): boolean {
  const now = new Date();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = dayNames[now.getDay()] as keyof typeof this.operatingHours;
  const hours = this.operatingHours[currentDay];
  
  if (hours.isClosed) return false;
  
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  
  return currentTime >= hours.open && currentTime <= hours.close;
};

/**
 * Check if restaurant can deliver to a specific distance
 */
restaurantSchema.methods.canDeliver = function (distance: number): boolean {
  return distance <= this.deliveryRadius;
};

// ========== Static Methods ==========

/**
 * Find restaurants by cuisine type
 */
restaurantSchema.statics.findByCuisine = function (cuisineType: string) {
  return this.find({
    cuisineTypes: cuisineType,
    isActive: true,
    isVerified: true,
  });
};

/**
 * Find restaurants within delivery radius
 */
restaurantSchema.statics.findNearby = function (
  latitude: number,
  longitude: number,
  maxDistance: number = 10000 // in meters
) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
    isVerified: true,
  });
};

/**
 * Find top-rated restaurants
 */
restaurantSchema.statics.findTopRated = function (limit: number = 10) {
  return this.find({ isActive: true, isVerified: true })
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(limit);
};

// ========== Virtual Properties ==========

/**
 * Full address
 */
restaurantSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.zipCode}, ${this.address.country}`;
});

/**
 * Is open now
 */
restaurantSchema.virtual("isOpenNow").get(function () {
  return this.isCurrentlyOpen();
});

const Restaurant = mongoose.model<IRestaurant>("Restaurant", restaurantSchema);

export default Restaurant;