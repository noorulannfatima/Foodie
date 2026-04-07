import { create } from 'zustand';
import { restaurantAPI } from '@/services/api/restaurant.api';

// ========== Types ==========

interface OperatingDay {
  open: string;
  close: string;
  isClosed: boolean;
}

interface RestaurantProfile {
  _id: string;
  name: string;
  email: string;
  description: string;
  phone: string;
  address: { street: string; city: string; zipCode: string; country: string };
  cuisineTypes: string[];
  image: string[];
  logo?: string;
  averageRating: number;
  totalReviews: number;
  operatingHours: {
    monday: OperatingDay;
    tuesday: OperatingDay;
    wednesday: OperatingDay;
    thursday: OperatingDay;
    friday: OperatingDay;
    saturday: OperatingDay;
    sunday: OperatingDay;
  };
  deliveryOptions: string[];
  paymentMethods: string[];
  deliveryRadius: number;
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  totalOrders: number;
  totalRevenue: number;
  isActive: boolean;
  isVerified: boolean;
  isPremium: boolean;
  isBusy: boolean;
}

interface DashboardStats {
  restaurant: {
    name: string;
    isActive: boolean;
    isBusy: boolean;
    averageRating: number;
    totalReviews: number;
  };
  today: {
    totalOrders: number;
    totalRevenue: number;
    pendingCount: number;
    preparingCount: number;
    readyCount: number;
  };
  recentOrders: OrderItem[];
}

interface OrderCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface OrderItem {
  _id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    customizations?: any[];
    specialInstructions?: string;
  }>;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    tip: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    zipCode: string;
    instructions?: string;
  };
  status: string;
  timeline: Array<{ status: string; timestamp: string; note?: string }>;
  estimatedPreparationTime: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface MenuCategory {
  _id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isAvailable: boolean;
}

export interface MenuItem {
  _id: string;
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
  spiceLevel?: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  preparationTime: number;
  calories?: number;
  isAvailable: boolean;
  customizations: Array<{
    name: string;
    options: Array<{ name: string; price: number }>;
    isRequired: boolean;
    maxSelection?: number;
  }>;
}

interface MenuData {
  _id: string;
  restaurant: string;
  categories: MenuCategory[];
  items: MenuItem[];
  isActive: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ========== Store ==========

interface RestaurantState {
  // Dashboard
  dashboard: DashboardStats | null;
  dashboardLoading: boolean;

  // Profile
  profile: RestaurantProfile | null;
  profileLoading: boolean;

  // Orders
  orders: OrderItem[];
  ordersPagination: Pagination | null;
  ordersLoading: boolean;
  selectedOrder: OrderItem | null;

  // Menu
  menu: MenuData | null;
  menuLoading: boolean;

  // Error
  error: string | null;

  // Actions — Dashboard
  fetchDashboard: () => Promise<void>;

  // Actions — Profile
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<void>;
  toggleActive: (isActive: boolean) => Promise<void>;
  toggleBusy: (isBusy: boolean) => Promise<void>;

  // Actions — Orders
  fetchOrders: (params?: { status?: string; page?: number }) => Promise<void>;
  fetchOrderDetail: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;

  // Actions — Menu
  fetchMenu: () => Promise<void>;
  addCategory: (data: { name: string; description?: string }) => Promise<void>;
  addMenuItem: (data: Record<string, any>) => Promise<void>;
  updateMenuItem: (itemId: string, data: Record<string, any>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  toggleItemAvailability: (itemId: string, isAvailable: boolean) => Promise<void>;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  dashboard: null,
  dashboardLoading: false,
  profile: null,
  profileLoading: false,
  orders: [],
  ordersPagination: null,
  ordersLoading: false,
  selectedOrder: null,
  menu: null,
  menuLoading: false,
  error: null,

  // ========== Dashboard ==========
  fetchDashboard: async () => {
    set({ dashboardLoading: true, error: null });
    try {
      const data = await restaurantAPI.getDashboard();
      set({ dashboard: data, dashboardLoading: false });
    } catch (error: any) {
      set({ dashboardLoading: false, error: error.message });
    }
  },

  // ========== Profile ==========
  fetchProfile: async () => {
    set({ profileLoading: true, error: null });
    try {
      const data = await restaurantAPI.getProfile();
      set({ profile: data.restaurant, profileLoading: false });
    } catch (error: any) {
      set({ profileLoading: false, error: error.message });
    }
  },

  updateProfile: async (updates) => {
    set({ profileLoading: true, error: null });
    try {
      const data = await restaurantAPI.updateProfile(updates);
      set({ profile: data.restaurant, profileLoading: false });
    } catch (error: any) {
      set({ profileLoading: false, error: error.message });
      throw error;
    }
  },

  toggleActive: async (isActive) => {
    try {
      await restaurantAPI.updateStatus({ isActive });
      set((state) => ({
        profile: state.profile ? { ...state.profile, isActive } : null,
        dashboard: state.dashboard
          ? { ...state.dashboard, restaurant: { ...state.dashboard.restaurant, isActive } }
          : null,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  toggleBusy: async (isBusy) => {
    try {
      await restaurantAPI.updateStatus({ isBusy });
      set((state) => ({
        profile: state.profile ? { ...state.profile, isBusy } : null,
        dashboard: state.dashboard
          ? { ...state.dashboard, restaurant: { ...state.dashboard.restaurant, isBusy } }
          : null,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // ========== Orders ==========
  fetchOrders: async (params) => {
    set({ ordersLoading: true, error: null });
    try {
      const data = await restaurantAPI.getOrders(params);
      set({ orders: data.orders, ordersPagination: data.pagination, ordersLoading: false });
    } catch (error: any) {
      set({ ordersLoading: false, error: error.message });
    }
  },

  fetchOrderDetail: async (orderId) => {
    try {
      const data = await restaurantAPI.getOrderDetail(orderId);
      set({ selectedOrder: data.order });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      await restaurantAPI.updateOrderStatus(orderId, status);
      // Refresh orders list after status change
      set((state) => ({
        orders: state.orders.map((o) =>
          o._id === orderId ? { ...o, status } : o
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // ========== Menu ==========
  fetchMenu: async () => {
    set({ menuLoading: true, error: null });
    try {
      const data = await restaurantAPI.getMenu();
      set({ menu: data.menu, menuLoading: false });
    } catch (error: any) {
      set({ menuLoading: false, error: error.message });
    }
  },

  addCategory: async (data) => {
    try {
      const result = await restaurantAPI.addCategory(data);
      set({ menu: result.menu });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  addMenuItem: async (data) => {
    try {
      const result = await restaurantAPI.addMenuItem(data);
      set({ menu: result.menu });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateMenuItem: async (itemId, data) => {
    try {
      const result = await restaurantAPI.updateMenuItem(itemId, data);
      set({ menu: result.menu });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteMenuItem: async (itemId) => {
    try {
      const result = await restaurantAPI.deleteMenuItem(itemId);
      set({ menu: result.menu });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleItemAvailability: async (itemId, isAvailable) => {
    try {
      const result = await restaurantAPI.toggleItemAvailability(itemId, isAvailable);
      set({ menu: result.menu });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
