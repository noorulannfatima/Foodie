import { create } from 'zustand';
import { customerAPI } from '@/services/api/customer.api';

// ========== Types ==========

export interface CartItem {
  _id: string;
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  customizations: Array<{
    name: string;
    selectedOptions: Array<{ name: string; price: number }>;
  }>;
  specialInstructions?: string;
  itemTotal: number;
}

interface CartRestaurant {
  _id: string;
  name: string;
  logo?: string;
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
}

export interface Cart {
  _id: string;
  customer: string;
  restaurant: CartRestaurant;
  items: CartItem[];
  subtotal: number;
  status: string;
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addToCart: (data: {
    restaurantId: string;
    menuItem: string;
    name: string;
    price: number;
    quantity?: number;
    customizations?: any[];
    specialInstructions?: string;
  }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Computed helpers
  itemCount: () => number;
  deliveryFee: () => number;
  tax: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const data = await customerAPI.getCart();
      set({ cart: data.cart, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  addToCart: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await customerAPI.addToCart(data);
      set({ cart: result.cart, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    // Optimistic update
    const prevCart = get().cart;
    if (prevCart) {
      if (quantity <= 0) {
        set({
          cart: {
            ...prevCart,
            items: prevCart.items.filter((i) => i._id !== itemId),
          },
        });
      } else {
        set({
          cart: {
            ...prevCart,
            items: prevCart.items.map((i) =>
              i._id === itemId ? { ...i, quantity, itemTotal: i.price * quantity } : i
            ),
          },
        });
      }
    }

    try {
      const result = await customerAPI.updateCartItem(itemId, quantity);
      set({ cart: result.cart });
    } catch (error: any) {
      // Revert on failure
      set({ cart: prevCart, error: error.message });
    }
  },

  removeItem: async (itemId) => {
    const prevCart = get().cart;
    if (prevCart) {
      set({
        cart: {
          ...prevCart,
          items: prevCart.items.filter((i) => i._id !== itemId),
        },
      });
    }

    try {
      const result = await customerAPI.removeCartItem(itemId);
      set({ cart: result.cart });
    } catch (error: any) {
      set({ cart: prevCart, error: error.message });
    }
  },

  clearCart: async () => {
    try {
      await customerAPI.clearCart();
      set({ cart: null });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Computed
  itemCount: () => {
    const cart = get().cart;
    if (!cart) return 0;
    return cart.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  deliveryFee: () => {
    const cart = get().cart;
    return cart?.restaurant?.deliveryFee ?? 0;
  },

  tax: () => {
    const cart = get().cart;
    if (!cart) return 0;
    return Math.round(cart.subtotal * 0.05 * 100) / 100;
  },

  total: () => {
    const cart = get().cart;
    if (!cart) return 0;
    const subtotal = cart.subtotal;
    const delivery = cart.restaurant?.deliveryFee ?? 0;
    const taxAmt = Math.round(subtotal * 0.05 * 100) / 100;
    return subtotal + delivery + taxAmt;
  },
}));
