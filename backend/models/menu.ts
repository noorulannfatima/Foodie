import mongoose, { Document } from "mongoose";

export interface IMenuItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  image: string[];
  category: string;
  tags: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel?: "Mild" | "Medium" | "Hot" | "Extra Hot";
  preparationTime: number; // in minutes
  calories?: number;
  isAvailable: boolean;
  customizations: Array<{
    name: string;
    options: Array<{
      name: string;
      price: number;
    }>;
    isRequired: boolean;
    maxSelection?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenu extends Document {
  restaurant: mongoose.Types.ObjectId;
  categories: Array<{
    _id?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    displayOrder: number;
    isAvailable: boolean;
  }>;
  items: IMenuItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addCategory(categoryData: any): Promise<IMenu>;
  addItem(itemData: any): Promise<IMenu>;
  updateItem(itemId: string, updates: any): Promise<IMenu>;
  removeItem(itemId: string): Promise<IMenu>;
  getItemsByCategory(categoryName: string): IMenuItem[];
  getAvailableItems(): IMenuItem[];
}

// Menu Schema
const menuSchema = new mongoose.Schema<IMenu>(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
    },
    
    categories: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        displayOrder: {
          type: Number,
          default: 0,
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
    
    items: [
      {
        name: {
          type: String,
          required: [true, "Item name is required"],
          trim: true,
        },
        description: {
          type: String,
          required: [true, "Description is required"],
          trim: true,
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: 0,
        },
        discountedPrice: {
          type: Number,
          min: 0,
        },
        image: {
          type: [String],
          default: [],
        },
        category: {
          type: String,
          required: true,
        },
        tags: {
          type: [String],
          default: [],
        },
        isVegetarian: {
          type: Boolean,
          default: false,
        },
        isVegan: {
          type: Boolean,
          default: false,
        },
        isGlutenFree: {
          type: Boolean,
          default: false,
        },
        spiceLevel: {
          type: String,
          enum: ["Mild", "Medium", "Hot", "Extra Hot"],
        },
        preparationTime: {
          type: Number,
          required: true,
          min: 5,
          default: 15,
        },
        calories: {
          type: Number,
          min: 0,
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
        customizations: [
          {
            name: {
              type: String,
              required: true,
            },
            options: [
              {
                name: {
                  type: String,
                  required: true,
                },
                price: {
                  type: Number,
                  required: true,
                  min: 0,
                },
              },
            ],
            isRequired: {
              type: Boolean,
              default: false,
            },
            maxSelection: {
              type: Number,
              min: 1,
            },
          },
        ],
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
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
menuSchema.index({ restaurant: 1 });
menuSchema.index({ "items.category": 1 });
menuSchema.index({ "items.isAvailable": 1 });

// Instance Methods

/**
 * Add a new category
 */
menuSchema.methods.addCategory = async function (categoryData: any): Promise<IMenu> {
  const exists = this.categories.find((cat: any) => cat.name === categoryData.name);
  
  if (exists) {
    throw new Error("Category already exists");
  }
  
  this.categories.push({
    ...categoryData,
    displayOrder: this.categories.length,
  });
  
  return await (this as any).save();
};

/**
 * Add a new item
 */
menuSchema.methods.addItem = async function (itemData: any): Promise<IMenu> {
  // Verify category exists
  const categoryExists = this.categories.find(
    (cat: any) => cat.name === itemData.category
  );
  
  if (!categoryExists) {
    throw new Error("Category does not exist");
  }
  
  this.items.push({
    ...itemData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return await (this as any).save();
};

/**
 * Update an item
 */
menuSchema.methods.updateItem = async function (
  itemId: string,
  updates: any
): Promise<IMenu> {
  const item = this.items.find((item: any) => item._id.toString() === itemId);
  
  if (!item) {
    throw new Error("Item not found");
  }
  
  Object.assign(item, updates);
  (item as any).updatedAt = new Date();
  
  return await (this as any).save();
};

/**
 * Remove an item
 */
menuSchema.methods.removeItem = async function (itemId: string): Promise<IMenu> {
  this.items = this.items.filter((item: any) => item._id.toString() !== itemId);
  return await (this as any).save();
};

/**
 * Get items by category
 */
menuSchema.methods.getItemsByCategory = function (categoryName: string): IMenuItem[] {
  return this.items.filter((item: any) => item.category === categoryName);
};

/**
 * Get available items
 */
menuSchema.methods.getAvailableItems = function (): IMenuItem[] {
  return this.items.filter((item: any) => item.isAvailable);
};

const Menu = mongoose.model<IMenu>("Menu", menuSchema);

export default Menu;