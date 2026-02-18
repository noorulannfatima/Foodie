import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IDeliveryPerson extends Document {
  // Basic Information
  name: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: string;
  
  // Vehicle Information
  vehicle: {
    type: "Bike" | "Scooter" | "Car" | "Bicycle";
    model?: string;
    plateNumber: string;
    color?: string;
  };
  
  // License & Documents
  licenseNumber: string;
  licenseExpiry?: Date;
  documents: {
    license?: string;
    insurance?: string;
    registration?: string;
    idCard?: string;
  };
  
  // Location Tracking
  currentLocation: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
    lastUpdated: Date;
  };
  
  // Availability & Status
  isAvailable: boolean;
  isOnline: boolean;
  isActive: boolean;
  isVerified: boolean;
  
  // Delivery Stats
  stats: {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    averageRating: number;
    totalRatings: number;
    acceptanceRate: number; // Percentage of accepted orders
    onTimeDeliveryRate: number; // Percentage of on-time deliveries
  };
  
  // Earnings
  earnings: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    lastPayout?: Date;
  };
  
  // Ratings & Reviews
  ratings: Array<{
    _id?: mongoose.Types.ObjectId;
    order: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
  }>;
  
  // Delivery History
  deliveryHistory: Array<{
    _id?: mongoose.Types.ObjectId;
    order: mongoose.Types.ObjectId;
    restaurant: mongoose.Types.ObjectId;
    customer: mongoose.Types.ObjectId;
    pickupTime?: Date;
    deliveryTime?: Date;
    status: "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "cancelled";
    earnings: number;
    distance: number; // in kilometers
    duration: number; // in minutes
    issues?: string;
    createdAt: Date;
  }>;
  
  // Bank Details for Payouts
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode?: string;
  };
  
  // Emergency Contact
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  
  // Timestamps
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  updateLocation(longitude: number, latitude: number): Promise<IDeliveryPerson>;
  addDelivery(deliveryData: any): Promise<IDeliveryPerson>;
  updateEarnings(amount: number): Promise<IDeliveryPerson>;
  calculateAverageRating(): Promise<void>;
  addRating(ratingData: any): Promise<IDeliveryPerson>;
}

// Delivery Person Schema Definition
const deliveryPersonSchema = new mongoose.Schema<IDeliveryPerson>(
  {
    // ========== Basic Information ==========
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
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
    
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      unique: true,
      match: [/^[\d\s\+\-\(\)]+$/, "Please provide a valid phone number"],
    },
    
    profileImage: {
      type: String,
      default: null,
    },
    
    // ========== Vehicle Information ==========
    vehicle: {
      type: {
        type: String,
        required: [true, "Vehicle type is required"],
        enum: ["Bike", "Scooter", "Car", "Bicycle"],
      },
      model: {
        type: String,
        trim: true,
      },
      plateNumber: {
        type: String,
        required: [true, "Plate number is required"],
        trim: true,
        uppercase: true,
      },
      color: {
        type: String,
        trim: true,
      },
    },
    
    // ========== License & Documents ==========
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      trim: true,
      uppercase: true,
    },
    
    licenseExpiry: {
      type: Date,
    },
    
    documents: {
      license: String, // URL to license document
      insurance: String,
      registration: String,
      idCard: String,
    },
    
    // ========== Location Tracking ==========
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0],
        validate: {
          validator: function (v: number[]) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && 
                   v[1] >= -90 && v[1] <= 90;
          },
          message: "Invalid coordinates",
        },
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    
    // ========== Availability & Status ==========
    isAvailable: {
      type: Boolean,
      default: true,
    },
    
    isOnline: {
      type: Boolean,
      default: false,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    // ========== Delivery Stats ==========
    stats: {
      totalDeliveries: {
        type: Number,
        default: 0,
        min: 0,
      },
      completedDeliveries: {
        type: Number,
        default: 0,
        min: 0,
      },
      cancelledDeliveries: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalRatings: {
        type: Number,
        default: 0,
        min: 0,
      },
      acceptanceRate: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      onTimeDeliveryRate: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
    },
    
    // ========== Earnings ==========
    earnings: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      today: {
        type: Number,
        default: 0,
        min: 0,
      },
      thisWeek: {
        type: Number,
        default: 0,
        min: 0,
      },
      thisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },
      pending: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastPayout: {
        type: Date,
      },
    },
    
    // ========== Ratings & Reviews ==========
    ratings: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
          maxlength: [300, "Comment cannot exceed 300 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // ========== Delivery History ==========
    deliveryHistory: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
        restaurant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Restaurant",
          required: true,
        },
        customer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        pickupTime: {
          type: Date,
        },
        deliveryTime: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"],
          default: "assigned",
        },
        earnings: {
          type: Number,
          required: true,
          min: 0,
        },
        distance: {
          type: Number,
          required: true,
          min: 0,
        },
        duration: {
          type: Number, // in minutes
          min: 0,
        },
        issues: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // ========== Bank Details ==========
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
      ifscCode: {
        type: String,
        trim: true,
      },
    },
    
    // ========== Emergency Contact ==========
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      relation: {
        type: String,
        trim: true,
      },
    },
    
    // ========== Activity Tracking ==========
    lastActiveAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== Indexes for Performance ==========
deliveryPersonSchema.index({ email: 1 });
deliveryPersonSchema.index({ phone: 1 });
deliveryPersonSchema.index({ isAvailable: 1, isOnline: 1, isActive: 1 });
deliveryPersonSchema.index({ "stats.averageRating": -1 });
deliveryPersonSchema.index({ currentLocation: "2dsphere" }); // For geospatial queries

// ========== Pre-Save Middleware ==========

// Hash password before saving
deliveryPersonSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update total deliveries when history changes
deliveryPersonSchema.pre("save", function () {
  if (this.isModified("deliveryHistory")) {
    this.stats.totalDeliveries = this.deliveryHistory.length;
    this.stats.completedDeliveries = this.deliveryHistory.filter(
      (d: any) => d.status === "delivered"
    ).length;
    this.stats.cancelledDeliveries = this.deliveryHistory.filter(
      (d: any) => d.status === "cancelled"
    ).length;
  }
});

// ========== Instance Methods ==========

/**
 * Compare provided password with hashed password
 */
deliveryPersonSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

/**
 * Update current location
 */
deliveryPersonSchema.methods.updateLocation = async function (
  longitude: number,
  latitude: number
): Promise<IDeliveryPerson> {
  this.currentLocation.coordinates = [longitude, latitude];
  this.currentLocation.lastUpdated = new Date();
  this.lastActiveAt = new Date();
  return await (this as any).save();
};

/**
 * Add delivery to history
 */
deliveryPersonSchema.methods.addDelivery = async function (
  deliveryData: any
): Promise<IDeliveryPerson> {
  this.deliveryHistory.push({
    ...deliveryData,
    createdAt: new Date(),
  });
  
  // Update stats
  this.stats.totalDeliveries += 1;
  if (deliveryData.status === "delivered") {
    this.stats.completedDeliveries += 1;
  } else if (deliveryData.status === "cancelled") {
    this.stats.cancelledDeliveries += 1;
  }
  
  return await (this as any).save();
};

/**
 * Update earnings
 */
deliveryPersonSchema.methods.updateEarnings = async function (
  amount: number
): Promise<IDeliveryPerson> {
  this.earnings.total += amount;
  this.earnings.today += amount;
  this.earnings.thisWeek += amount;
  this.earnings.thisMonth += amount;
  this.earnings.pending += amount;
  
  return await (this as any).save();
};

/**
 * Calculate average rating
 */
deliveryPersonSchema.methods.calculateAverageRating = async function (): Promise<void> {
  if (this.ratings.length === 0) {
    this.stats.averageRating = 0;
    this.stats.totalRatings = 0;
    return;
  }
  
  const totalRating = this.ratings.reduce(
    (sum: number, rating: any) => sum + rating.rating,
    0
  );
  
  this.stats.averageRating = Math.round((totalRating / this.ratings.length) * 10) / 10;
  this.stats.totalRatings = this.ratings.length;
};

/**
 * Add rating
 */
deliveryPersonSchema.methods.addRating = async function (
  ratingData: any
): Promise<IDeliveryPerson> {
  this.ratings.push({
    ...ratingData,
    createdAt: new Date(),
  });
  
  await this.calculateAverageRating();
  return await (this as any).save();
};

// ========== Static Methods ==========

/**
 * Find available delivery persons nearby
 */
deliveryPersonSchema.statics.findAvailableNearby = function (
  longitude: number,
  latitude: number,
  maxDistance: number = 5000 // in meters
) {
  return this.find({
    isAvailable: true,
    isOnline: true,
    isActive: true,
    isVerified: true,
    currentLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  }).sort({ "stats.averageRating": -1 });
};

/**
 * Find top-rated delivery persons
 */
deliveryPersonSchema.statics.findTopRated = function (limit: number = 10) {
  return this.find({ isActive: true, isVerified: true })
    .sort({ "stats.averageRating": -1, "stats.totalDeliveries": -1 })
    .limit(limit);
};

/**
 * Reset daily earnings (to be called by cron job)
 */
deliveryPersonSchema.statics.resetDailyEarnings = async function () {
  await this.updateMany({}, { $set: { "earnings.today": 0 } });
};

/**
 * Reset weekly earnings (to be called by cron job)
 */
deliveryPersonSchema.statics.resetWeeklyEarnings = async function () {
  await this.updateMany({}, { $set: { "earnings.thisWeek": 0 } });
};

/**
 * Reset monthly earnings (to be called by cron job)
 */
deliveryPersonSchema.statics.resetMonthlyEarnings = async function () {
  await this.updateMany({}, { $set: { "earnings.thisMonth": 0 } });
};

// ========== Virtual Properties ==========

/**
 * Completion rate
 */
deliveryPersonSchema.virtual("completionRate").get(function () {
  if (this.stats.totalDeliveries === 0) return 100;
  return Math.round(
    (this.stats.completedDeliveries / this.stats.totalDeliveries) * 100
  );
});

/**
 * Is license expired
 */
deliveryPersonSchema.virtual("isLicenseExpired").get(function () {
  if (!this.licenseExpiry) return false;
  return new Date() > this.licenseExpiry;
});

/**
 * Total distance covered
 */
deliveryPersonSchema.virtual("totalDistance").get(function () {
  return this.deliveryHistory.reduce(
    (total: number, delivery: any) => total + delivery.distance,
    0
  );
});

const DeliveryPerson = mongoose.model<IDeliveryPerson>(
  "DeliveryPerson",
  deliveryPersonSchema
);

export default DeliveryPerson;