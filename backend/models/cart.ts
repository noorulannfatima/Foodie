import mongoose, { Document } from "mongoose";

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  menuItem: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  customizations: Array<{
    name: string;
    selectedOptions: Array<{
      name: string;
      price: number;
    }>;
  }>;
  specialInstructions?: string;
  itemTotal: number;
}

export interface ICart extends Document {
  customer: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  items: ICartItem[];
  subtotal: number;
  status: "Active" | "Checkout" | "Completed" | "Abandoned";
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addItem(itemData: any): Promise<ICart>;
  updateItemQuantity(itemId: string, quantity: number): Promise<ICart>;
  removeItem(itemId: string): Promise<ICart>;
  clearCart(): Promise<ICart>;
  calculateSubtotal(): number;
  validateCart(): Promise<boolean>;
}

// Cart Schema
const cartSchema = new mongoose.Schema<ICart>(
  {
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
    
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
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
          maxlength: 200,
        },
        itemTotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    
    status: {
      type: String,
      enum: ["Active", "Checkout", "Completed", "Abandoned"],
      default: "Active",
    },
    
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ========== Indexes ==========
cartSchema.index({ customer: 1, status: 1 });
cartSchema.index({ restaurant: 1 });
cartSchema.index({ lastUpdated: 1 });

// ========== Pre-Save Middleware ==========

// Calculate subtotal before saving
cartSchema.pre("save", function () {
  this.subtotal = this.calculateSubtotal();
  this.lastUpdated = new Date();
});

// ========== Instance Methods ==========

/**
 * Add item to cart
 */
cartSchema.methods.addItem = async function (itemData: any): Promise<ICart> {
  // Calculate customizations total
  let customizationsTotal = 0;
  if (itemData.customizations) {
    itemData.customizations.forEach((custom: any) => {
      custom.selectedOptions.forEach((option: any) => {
        customizationsTotal += option.price;
      });
    });
  }
  
  // Calculate item total
  const itemTotal = (itemData.price + customizationsTotal) * itemData.quantity;
  
  // Check if identical item exists (same customizations)
  const existingItemIndex = this.items.findIndex((item: any) => {
    if (item.menuItem.toString() !== itemData.menuItem.toString()) return false;
    
    // Compare customizations
    if (!itemData.customizations || itemData.customizations.length === 0) {
      return !item.customizations || item.customizations.length === 0;
    }
    
    return JSON.stringify(item.customizations) === JSON.stringify(itemData.customizations);
  });
  
  if (existingItemIndex !== -1) {
    // Update quantity of existing item
    this.items[existingItemIndex].quantity += itemData.quantity;
    this.items[existingItemIndex].itemTotal = 
      (this.items[existingItemIndex].price + customizationsTotal) * 
      this.items[existingItemIndex].quantity;
  } else {
    // Add new item
    this.items.push({
      ...itemData,
      itemTotal,
    });
  }
  
  return await (this as any).save();
};

/**
 * Update item quantity
 */
cartSchema.methods.updateItemQuantity = async function (
  itemId: string,
  quantity: number
): Promise<ICart> {
  if (quantity <= 0) {
    return this.removeItem(itemId);
  }
  
  const item = this.items.find((item: any) => item._id.toString() === itemId);
  
  if (!item) {
    throw new Error("Item not found in cart");
  }
  
  item.quantity = quantity;
  
  // Recalculate item total
  let customizationsTotal = 0;
  if (item.customizations) {
    item.customizations.forEach((custom: any) => {
      custom.selectedOptions.forEach((option: any) => {
        customizationsTotal += option.price;
      });
    });
  }
  
  item.itemTotal = (item.price + customizationsTotal) * quantity;
  
  return await (this as any).save();
};

/**
 * Remove item from cart
 */
cartSchema.methods.removeItem = async function (itemId: string): Promise<ICart> {
  this.items = this.items.filter((item: any) => item._id.toString() !== itemId);
  return await (this as any).save();
};

/**
 * Clear all items from cart
 */
cartSchema.methods.clearCart = async function (): Promise<ICart> {
  this.items = [];
  this.subtotal = 0;
  return await (this as any).save();
};

/**
 * Calculate cart subtotal
 */
cartSchema.methods.calculateSubtotal = function (): number {
  return this.items.reduce((total: number, item: any) => total + item.itemTotal, 0);
};

/**
 * Validate cart items availability
 */
cartSchema.methods.validateCart = async function (): Promise<boolean> {
  // This would check if all items are still available in the menu
  // Implementation depends on your menu validation logic
  return true;
};

// ========== Static Methods ==========

/**
 * Find active cart for customer
 */
cartSchema.statics.findActiveCart = function (customerId: string) {
  return this.findOne({
    customer: customerId,
    status: "Active",
  }).populate("restaurant", "name logo minimumOrder deliveryFee");
};

/**
 * Create or get cart for customer
 */
cartSchema.statics.getOrCreateCart = async function (
  customerId: string,
  restaurantId: string
) {
  let cart = await this.findOne({
    customer: customerId,
    status: "Active",
  });
  
  // If cart exists but for different restaurant, clear it
  if (cart && cart.restaurant.toString() !== restaurantId) {
    await cart.clearCart();
    cart.restaurant = new mongoose.Types.ObjectId(restaurantId);
    await cart.save();
  }
  
  // If no cart exists, create new one
  if (!cart) {
    cart = await this.create({
      customer: customerId,
      restaurant: restaurantId,
      items: [],
      status: "Active",
    });
  }
  
  return cart;
};

/**
 * Clean up abandoned carts (older than 7 days)
 */
cartSchema.statics.cleanAbandonedCarts = async function () {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  await this.updateMany(
    {
      status: "Active",
      lastUpdated: { $lt: sevenDaysAgo },
    },
    {
      $set: { status: "Abandoned" },
    }
  );
};

// ========== Virtual Properties ==========

/**
 * Item count
 */
cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((count: number, item: any) => count + item.quantity, 0);
});

/**
 * Is empty
 */
cartSchema.virtual("isEmpty").get(function () {
  return this.items.length === 0;
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;