import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Interface representing a User document in MongoDB.
 * Defines the structure for basic info, addresses, preferences, and loyalty data.
 */

/** Languages the customer app is translated into; also used for push notification text. */
export const CUSTOMER_LANGUAGES = ["en", "ur", "es", "fr"] as const;
export type CustomerLanguage = (typeof CUSTOMER_LANGUAGES)[number];

export function normalizeCustomerLanguage(value: unknown): CustomerLanguage {
  return CUSTOMER_LANGUAGES.includes(value as CustomerLanguage) ? (value as CustomerLanguage) : "en";
}

export interface IUser extends Document {
  // Basic Information
  name: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  
  // Address Management
  savedAddresses: Array<{
    _id?: mongoose.Types.ObjectId;
    /** Short name shown in pickers: "Home", "Work" or the customer's own. */
    label: string;
    streetAddress: string;
    city: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
    isDefault: boolean;
    createdAt: Date;
  }>;
  
  // User Preferences
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      orderUpdates: boolean;
      promotions: boolean;
    };
    defaultPaymentMethod: "card" | "cash" | "wallet";
    language: string;
    currency: string;
  };
  
  pushTokens: string[]; // Expo push tokens, one per signed-in device
  
  // Loyalty Program
  loyaltyPoints: number;
  totalSpent: number;
  
  // User Activity
  lastLoginAt?: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  getDefaultAddress(): any;
  addLoyaltyPoints(points: number): Promise<IUser>;
  deductLoyaltyPoints(points: number): Promise<IUser>;
}

// User Schema Definition - defines data constraints and validation
const userSchema = new mongoose.Schema<IUser>(
  {
    // ========== Basic Information ==========
    // Used for initial registration and profile management
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
      select: false, // Don't return password by default in queries
    },
    
    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\+\-\(\)]+$/, "Please provide a valid phone number"],
    },
    
    profileImage: {
      type: String,
      default: null,
    },
    
    // ========== Address Management ==========
    savedAddresses: [
      {
        label: {
          type: String,
          trim: true,
          default: "Home",
          maxlength: [30, "Label cannot exceed 30 characters"],
        },
        streetAddress: {
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
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
        instructions: {
          type: String,
          trim: true,
          maxlength: [200, "Instructions cannot exceed 200 characters"],
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // ========== User Preferences ==========
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        orderUpdates: {
          type: Boolean,
          default: true,
        },
        promotions: {
          type: Boolean,
          default: true,
        },
      },
      defaultPaymentMethod: {
        type: String,
        enum: ["card", "cash", "wallet"],
        default: "cash",
      },
      language: {
        type: String,
        default: "en",
      },
      currency: {
        type: String,
        default: "PKR",
      },
    },
    
    pushTokens: {
      type: [String],
      default: [],
      select: false,
    },
    
    // ========== Loyalty Program ==========
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ========== User Status ==========
    lastLoginAt: {
      type: Date,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== Indexes for Performance ==========

userSchema.index({ phone: 1 });
userSchema.index({ isActive: 1 });
userSchema.path('savedAddresses').default([]);
    

// ========== Pre-Save Middleware (Hooks) ==========

/**
 * Automatically hashes the password before saving a new user 
 * or updating an existing user's password.
 */
userSchema.pre("save", async function () {
  // Only hash if password is newly created or modified
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Ensure only one default address
userSchema.pre("save", function () {
  if (this.isModified("savedAddresses")) {
    // Keep the first flagged address as the default; with none flagged, use the first address
    const keep = Math.max(0, this.savedAddresses.findIndex((addr) => addr.isDefault));
    this.savedAddresses.forEach((addr, index) => {
      addr.isDefault = index === keep;
    });
  }
});

// ========== Instance Methods ==========

/**
 * Compare provided plain text password with the hashed password in DB.
 * Used during login flow.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

/**
 * Get default address
 */
userSchema.methods.getDefaultAddress = function () {
  return this.savedAddresses.find((addr: any) => addr.isDefault) || null;
};

/**
 * Add loyalty points
 */
userSchema.methods.addLoyaltyPoints = async function (
  points: number
): Promise<IUser> {
  this.loyaltyPoints += points;
  return await (this as any).save();
};

/**
 * Deduct loyalty points
 */
userSchema.methods.deductLoyaltyPoints = async function (
  points: number
): Promise<IUser> {
  if (this.loyaltyPoints < points) {
    throw new Error("Insufficient loyalty points");
  }
  this.loyaltyPoints -= points;
  return await (this as any).save();
};

// ========== Static Methods ==========

/**
 * Find active users
 */
userSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true });
};

/**
 * Find user by email with password
 */
userSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email }).select("+password");
};

// ========== Virtual Properties ==========

/**
 * Full address count
 */
userSchema.virtual("addressCount").get(function () {
  return this.savedAddresses?.length ?? 0;
});

/**
 * Virtual property to get a simplified public profile of the user.
 * Excludes sensitive data and internal fields.
 */
userSchema.virtual("profile").get(function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    profileImage: this.profileImage,
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified,
    loyaltyPoints: this.loyaltyPoints,
    createdAt: this.createdAt,
  };
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;