import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

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
  addSavedAddress(addressData: any, setAsDefault?: boolean): Promise<IUser>;
  removeSavedAddress(addressId: string): Promise<IUser>;
  getDefaultAddress(): any;
  addLoyaltyPoints(points: number): Promise<IUser>;
  deductLoyaltyPoints(points: number): Promise<IUser>;
}

// User Schema Definition
const userSchema = new mongoose.Schema<IUser>(
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
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ========== Pre-Save Middleware ==========

// Hash password before saving
userSchema.pre("save", async function () {
  // Only hash if password is modified
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Ensure only one default address
userSchema.pre("save", function () {
  if (this.isModified("savedAddresses")) {
    const defaultAddresses = this.savedAddresses.filter(addr => addr.isDefault);
    
    // If multiple defaults, keep only the first one
    if (defaultAddresses.length > 1) {
      this.savedAddresses.forEach((addr, index) => {
        if (index > 0) addr.isDefault = false;
      });
    }
    
    // If no default and addresses exist, set first as default
    if (defaultAddresses.length === 0 && this.savedAddresses.length > 0) {
      this.savedAddresses[0].isDefault = true;
    }
  }
});

// ========== Instance Methods ==========

/**
 * Compare provided password with hashed password
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
 * Add or update a saved address
 */
userSchema.methods.addSavedAddress = async function (
  addressData: any,
  setAsDefault: boolean = false
): Promise<IUser> {
  // If setting as default, make all others non-default
  if (setAsDefault) {
    this.savedAddresses.forEach((addr: any) => {
      addr.isDefault = false;
    });
  }
  
  // Check for duplicate address
  const existingIndex = this.savedAddresses.findIndex(
    (addr: any) =>
      addr.streetAddress === addressData.streetAddress &&
      addr.city === addressData.city &&
      addr.zipCode === addressData.zipCode
  );
  
  if (existingIndex !== -1) {
    // Update existing address
    this.savedAddresses[existingIndex] = {
      ...this.savedAddresses[existingIndex],
      ...addressData,
      isDefault: setAsDefault,
    };
  } else {
    // Add new address
    this.savedAddresses.push({
      ...addressData,
      isDefault: setAsDefault,
      createdAt: new Date(),
    });
  }
  
  return await (this as any).save();
};

/**
 * Remove a saved address
 */
userSchema.methods.removeSavedAddress = async function (
  addressId: string
): Promise<IUser> {
  const addressToRemove = this.savedAddresses.find(
    (addr: any) => addr._id.toString() === addressId
  );
  
  this.savedAddresses = this.savedAddresses.filter(
    (addr: any) => addr._id.toString() !== addressId
  );
  
  // If removed address was default, set first address as default
  if (addressToRemove?.isDefault && this.savedAddresses.length > 0) {
    this.savedAddresses[0].isDefault = true;
  }
  
  return await (this as any).save();
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
  return this.savedAddresses.length;
});

/**
 * User profile (public data only)
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