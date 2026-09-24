import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export const RESTAURANT_NOTIFICATION_KEYS = [
  // Channels
  "push",
  "email",
  "sms",
  // Alert categories
  "newOrders",
  "orderCancellations",
  "reviews",
  "payouts",
  "weeklySummary",
  "marketing",
] as const;

export type RestaurantNotificationKey = (typeof RESTAURANT_NOTIFICATION_KEYS)[number];

export type RestaurantNotificationPreferences = Record<RestaurantNotificationKey, boolean>;

export const DEFAULT_RESTAURANT_NOTIFICATION_PREFERENCES: RestaurantNotificationPreferences = {
  push: true,
  email: true,
  sms: false,
  newOrders: true,
  orderCancellations: true,
  reviews: true,
  payouts: true,
  weeklySummary: true,
  marketing: false,
};

/** Fills any keys missing on older documents with their defaults. */
export function normalizeNotificationPreferences(prefs: any): RestaurantNotificationPreferences {
  const normalized = { ...DEFAULT_RESTAURANT_NOTIFICATION_PREFERENCES };
  for (const key of RESTAURANT_NOTIFICATION_KEYS) {
    if (typeof prefs?.[key] === "boolean") normalized[key] = prefs[key];
  }
  return normalized;
}

export type PayoutMethod = "Bank" | "JazzCash" | "Easypaisa";
export type PayoutAccountStatus = "Pending" | "Verified" | "Rejected";

/** Where Foodie sends this restaurant's payouts. Verified by an admin before any payout is marked paid. */
export interface IPayoutAccount {
  method: PayoutMethod;
  accountTitle: string;
  bankName?: string;
  iban?: string; // Bank only
  mobileNumber?: string; // JazzCash / Easypaisa only
  status: PayoutAccountStatus;
  rejectionReason?: string;
  updatedAt: Date;
}

export const IBAN_REGEX = /^PK[0-9A-Z]{22}$/;
export const WALLET_MOBILE_REGEX = /^03\d{9}$/;

/** Shared with Payout.accountSnapshot. */
export const payoutAccountSchema = new mongoose.Schema<IPayoutAccount>(
  {
    method: { type: String, required: true, enum: ["Bank", "JazzCash", "Easypaisa"] },
    accountTitle: { type: String, required: true, trim: true, maxlength: 100 },
    bankName: { type: String, trim: true, maxlength: 100 },
    iban: { type: String, trim: true, uppercase: true, match: [IBAN_REGEX, "Invalid IBAN"] },
    mobileNumber: {
      type: String,
      trim: true,
      match: [WALLET_MOBILE_REGEX, "Mobile number must look like 03XXXXXXXXX"],
    },
    status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
    rejectionReason: { type: String, trim: true, maxlength: 300 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
  /**
   * Geographic coordinates stored in GeoJSON format.
   * Required for spatial indexing (2dsphere).
   */
  coordinates: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  
  // Restaurant Details
  cuisineTypes: string[];
  image: string[];
  logo?: string;
  
  // Ratings (derived from dish reviews in the Review collection; see rating.service)
  averageRating: number;
  totalReviews: number;
  
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
  
  // Payouts
  commissionRate: number; // Foodie's cut of each order subtotal, 0–0.5
  payoutAccount?: IPayoutAccount;
  
  // Restaurant Status
  isActive: boolean;
  isVerified: boolean;
  isPremium: boolean;
  isBusy: boolean; // Temporarily not accepting orders
  
  // Notification Preferences
  notificationPreferences: RestaurantNotificationPreferences;
  pushTokens: string[]; // Expo push tokens, one per signed-in device
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
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
    
    /**
     * GeoJSON Point field for location-based searching.
     * Required for MongoDB's 2dsphere index (e.g., finding nearby restaurants).
     * Format: { type: "Point", coordinates: [longitude, latitude] }
     */
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Coordinates are required"],
        default: [0, 0],
        validate: {
          validator: function (v: number[]) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 &&
              v[1] >= -90 &&
              v[1] <= 90
            );
          },
          message: "Invalid coordinates - [longitude, latitude] expected",
        },
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
      min: [0, "Minimum order cannot be negative"],
      max: [100000, "Minimum order cannot exceed Rs. 100,000"],
    },
    
    deliveryFee: {
      type: Number,
      default: 50,
      min: [0, "Delivery fee cannot be negative"],
      max: [10000, "Delivery fee cannot exceed Rs. 10,000"],
    },
    
    estimatedDeliveryTime: {
      type: Number,
      default: 30,
      min: [10, "Estimated delivery time must be at least 10 minutes"],
      max: [120, "Estimated delivery time cannot exceed 120 minutes"],
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
    
    // ========== Payouts ==========
    commissionRate: {
      type: Number,
      default: 0.15,
      min: [0, "Commission rate cannot be negative"],
      max: [0.5, "Commission rate cannot exceed 50%"],
    },
    
    payoutAccount: {
      type: payoutAccountSchema,
      default: undefined,
    },
    
    // ========== Notification Preferences ==========
    notificationPreferences: Object.fromEntries(
      RESTAURANT_NOTIFICATION_KEYS.map((key) => [
        key,
        { type: Boolean, default: DEFAULT_RESTAURANT_NOTIFICATION_PREFERENCES[key] },
      ])
    ),
    
    pushTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== Indexes for Performance ==========

restaurantSchema.index({ "address.city": 1 });
restaurantSchema.index({ "address.zipCode": 1 });
restaurantSchema.index({ cuisineTypes: 1 });
restaurantSchema.index({ averageRating: -1 });
restaurantSchema.index({ isActive: 1, isVerified: 1 });
restaurantSchema.index({ coordinates: "2dsphere" }); // For geospatial queries

// ========== Pre-Save Middleware ==========

// Hash password before saving
restaurantSchema.pre("save", async function (this: IRestaurant) {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
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
 * Full address string virtual
 */
restaurantSchema.virtual("fullAddress").get(function (this: IRestaurant) {
  return `${this.address.street}, ${this.address.city}, ${this.address.zipCode}, ${this.address.country}`;
});

/**
 * Is open now status virtual
 */
restaurantSchema.virtual("isOpenNow").get(function (this: IRestaurant) {
  return this.isCurrentlyOpen();
});

const Restaurant = mongoose.model<IRestaurant>("Restaurant", restaurantSchema);

export default Restaurant;