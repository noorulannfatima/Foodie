import mongoose, { Document } from "mongoose";

export interface IOrderItem {
  menuItem: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  customizations: Array<{
    name: string;
    selectedOptions: Array<{
      name: string;
      price: number;
    }>;
  }>;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  // Order Reference
  orderNumber: string;
  
  // Relationships
  customer: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  deliveryPerson?: mongoose.Types.ObjectId;
  
  // Order Items
  items: IOrderItem[];
  
  // Delivery Information
  deliveryAddress: {
    street: string;
    city: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  
  // Pricing
  pricing: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    tip: number;
    total: number;
  };
  
  // Payment
  payment: {
    method: "Cash" | "Card" | "Wallet" | "Online";
    status: "Pending" | "Completed" | "Failed" | "Refunded";
    transactionId?: string;
    paidAt?: Date;
  };
  
  // Order Status & Timeline
  status: "Pending" | "Confirmed" | "Preparing" | "Ready" | "PickedUp" | "OutForDelivery" | "Delivered" | "Cancelled";
  timeline: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  
  // Estimated & Actual Times
  estimatedPreparationTime: number; // in minutes
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  
  // Discount & Loyalty
  appliedCoupon?: {
    code: string;
    discountAmount: number;
  };
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  
  // Additional Information
  specialInstructions?: string;
  cancellationReason?: string;
  
  // Ratings
  customerRating?: {
    restaurant: number;
    delivery: number;
    food: number;
    comment?: string;
    ratedAt: Date;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateStatus(newStatus: string, note?: string): Promise<IOrder>;
  assignDeliveryPerson(deliveryPersonId: string): Promise<IOrder>;
  calculateTotal(): number;
  canBeCancelled(): boolean;
  addRating(ratingData: any): Promise<IOrder>;
}

// Order Schema
const orderSchema = new mongoose.Schema<IOrder>(
  {
    // ========== Order Reference ==========
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    
    // ========== Relationships ==========
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
    },
    
    // ========== Order Items ==========
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu.items",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        customizations: [
          {
            name: String,
            selectedOptions: [
              {
                name: String,
                price: Number,
              },
            ],
          },
        ],
        specialInstructions: {
          type: String,
          trim: true,
        },
      },
    ],
    
    // ========== Delivery Information ==========
    deliveryAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      latitude: Number,
      longitude: Number,
      instructions: String,
    },
    
    // ========== Pricing ==========
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      deliveryFee: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      tax: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      tip: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    
    // ========== Payment ==========
    payment: {
      method: {
        type: String,
        required: true,
        enum: ["Cash", "Card", "Wallet", "Online"],
      },
      status: {
        type: String,
        required: true,
        enum: ["Pending", "Completed", "Failed", "Refunded"],
        default: "Pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    
    // ========== Order Status & Timeline ==========
    status: {
      type: String,
      required: true,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "PickedUp",
        "OutForDelivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },
    
    timeline: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        note: String,
      },
    ],
    
    // ========== Time Estimates ==========
    estimatedPreparationTime: {
      type: Number,
      required: true,
      min: 5,
    },
    
    estimatedDeliveryTime: {
      type: Date,
      required: true,
    },
    
    actualDeliveryTime: {
      type: Date,
    },
    
    // ========== Discount & Loyalty ==========
    appliedCoupon: {
      code: String,
      discountAmount: {
        type: Number,
        min: 0,
      },
    },
    
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ========== Additional Information ==========
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [300, "Instructions cannot exceed 300 characters"],
    },
    
    cancellationReason: {
      type: String,
      trim: true,
    },
    
    // ========== Ratings ==========
    customerRating: {
      restaurant: {
        type: Number,
        min: 1,
        max: 5,
      },
      delivery: {
        type: Number,
        min: 1,
        max: 5,
      },
      food: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      ratedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ========== Indexes ==========
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ deliveryPerson: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// ========== Pre-Save Middleware ==========

// Generate order number before saving
orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD${Date.now()}${(count + 1).toString().padStart(4, "0")}`;
  }
});

// Add initial timeline entry
orderSchema.pre("save", function () {
  if (this.isNew) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: "Order placed",
    });
  }
});

// ========== Instance Methods ==========

/**
 * Update order status with timeline entry
 */
orderSchema.methods.updateStatus = async function (
  newStatus: string,
  note?: string
): Promise<IOrder> {
  this.status = newStatus as any;
  
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Order ${newStatus.toLowerCase()}`,
  });
  
  // Update actual delivery time if delivered
  if (newStatus === "Delivered") {
    this.actualDeliveryTime = new Date();
    this.payment.status = "Completed";
  }
  
  return await (this as any).save();
};

/**
 * Assign delivery person to order
 */
orderSchema.methods.assignDeliveryPerson = async function (
  deliveryPersonId: string
): Promise<IOrder> {
  this.deliveryPerson = new mongoose.Types.ObjectId(deliveryPersonId);
  
  this.timeline.push({
    status: "Assigned",
    timestamp: new Date(),
    note: "Delivery person assigned",
  });
  
  return await (this as any).save();
};

/**
 * Calculate order total
 */
orderSchema.methods.calculateTotal = function (): number {
  const { subtotal, deliveryFee, tax, discount, tip } = this.pricing;
  return subtotal + deliveryFee + tax - discount + tip;
};

/**
 * Check if order can be cancelled
 */
orderSchema.methods.canBeCancelled = function (): boolean {
  const cancellableStatuses = ["Pending", "Confirmed", "Preparing"];
  return cancellableStatuses.includes(this.status);
};

/**
 * Add customer rating
 */
orderSchema.methods.addRating = async function (ratingData: any): Promise<IOrder> {
  this.customerRating = {
    ...ratingData,
    ratedAt: new Date(),
  };
  
  return await (this as any).save();
};

// ========== Static Methods ==========

/**
 * Find orders by status
 */
orderSchema.statics.findByStatus = function (status: string) {
  return this.find({ status })
    .populate("customer", "name email phone")
    .populate("restaurant", "name address phone")
    .populate("deliveryPerson", "name phone vehicle")
    .sort({ createdAt: -1 });
};

/**
 * Find active orders for customer
 */
orderSchema.statics.findActiveOrdersByCustomer = function (customerId: string) {
  const activeStatuses = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Ready",
    "PickedUp",
    "OutForDelivery",
  ];
  
  return this.find({
    customer: customerId,
    status: { $in: activeStatuses },
  })
    .populate("restaurant", "name logo address phone")
    .sort({ createdAt: -1 });
};

/**
 * Get revenue for restaurant
 */
orderSchema.statics.getRestaurantRevenue = async function (
  restaurantId: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = {
    restaurant: restaurantId,
    status: "Delivered",
    "payment.status": "Completed",
  };
  
  if (startDate) query.createdAt = { $gte: startDate };
  if (endDate) query.createdAt = { ...query.createdAt, $lte: endDate };
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$pricing.subtotal" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);
  
  return result[0] || { totalRevenue: 0, totalOrders: 0 };
};

// ========== Virtual Properties ==========

/**
 * Is order active
 */
orderSchema.virtual("isActive").get(function () {
  const activeStatuses = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Ready",
    "PickedUp",
    "OutForDelivery",
  ];
  return activeStatuses.includes(this.status);
});

/**
 * Delivery duration (in minutes)
 */
orderSchema.virtual("deliveryDuration").get(function () {
  if (!this.actualDeliveryTime) return null;
  
  const duration = this.actualDeliveryTime.getTime() - this.createdAt.getTime();
  return Math.round(duration / 60000); // Convert to minutes
});

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;