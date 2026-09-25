import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Restaurant, {
  RESTAURANT_NOTIFICATION_KEYS,
  normalizeNotificationPreferences,
  type RestaurantNotificationKey,
} from '../models/restaurant';
import { claimPushToken, isExpoPushToken, releasePushToken } from '../services/push.service';
import { notifyOrderStatus } from '../services/orderStatusPush';
import Menu from '../models/menu';
import Order from '../models/order';

// ========== Dashboard ==========

/**
 * GET /restaurant/dashboard
 * Returns today's stats: orders, revenue, avg rating, pending count, recent orders
 */
export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const restaurantId = req.user!.id;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Aggregate today's stats
    const todayStats = await Order.aggregate([
      {
        $match: {
          restaurant: restaurant._id,
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
        },
      },
    ]);

    const pendingCount = await Order.countDocuments({
      restaurant: restaurantId,
      status: 'Pending',
    });

    const preparingCount = await Order.countDocuments({
      restaurant: restaurantId,
      status: 'Preparing',
    });

    const readyCount = await Order.countDocuments({
      restaurant: restaurantId,
      status: 'Ready',
    });

    // Recent 5 orders
    const recentOrders = await Order.find({ restaurant: restaurantId })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = todayStats[0] || { totalOrders: 0, totalRevenue: 0 };

    res.json({
      restaurant: {
        name: restaurant.name,
        isActive: restaurant.isActive,
        isBusy: restaurant.isBusy,
        averageRating: restaurant.averageRating,
        totalReviews: restaurant.totalReviews,
      },
      today: {
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        pendingCount,
        preparingCount,
        readyCount,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard' });
  }
}

// ========== Profile ==========

/**
 * GET /restaurant/profile
 * `totalOrders` is counted live (all orders except cancelled ones); the stored
 * field on the restaurant document is never incremented.
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const restaurant = await Restaurant.findById(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    const totalOrders = await Order.countDocuments({
      restaurant: restaurant._id,
      status: { $ne: 'Cancelled' },
    });
    res.json({ restaurant: { ...restaurant.toJSON(), totalOrders } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
}

const NUMERIC_PROFILE_FIELDS = [
  'deliveryRadius', 'minimumOrder', 'deliveryFee', 'estimatedDeliveryTime',
] as const;

/**
 * PUT /restaurant/profile
 */
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const allowedFields = [
      'name', 'description', 'phone', 'address', 'cuisineTypes',
      'image', 'logo', 'operatingHours', 'deliveryOptions',
      'paymentMethods', 'deliveryRadius', 'minimumOrder',
      'deliveryFee', 'estimatedDeliveryTime',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Mongoose would silently coerce "", null or "12abc"; reject anything that isn't a real number
    for (const field of NUMERIC_PROFILE_FIELDS) {
      if (updates[field] !== undefined && (typeof updates[field] !== 'number' || !Number.isFinite(updates[field]))) {
        res.status(400).json({ message: `${field} must be a number` });
        return;
      }
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user!.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    res.json({ restaurant });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }
    if (error.name === 'CastError') {
      res.status(400).json({ message: `Invalid value for ${error.path}` });
      return;
    }
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
}

/**
 * PUT /restaurant/status
 */
export async function updateStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { isActive, isBusy } = req.body;

    const updates: Record<string, boolean> = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (isBusy !== undefined) updates.isBusy = isBusy;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user!.id,
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    res.json({
      isActive: restaurant.isActive,
      isBusy: restaurant.isBusy,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating status' });
  }
}

// ========== Notification Preferences ==========

/**
 * GET /restaurant/notification-preferences
 */
export async function getNotificationPreferences(req: AuthRequest, res: Response): Promise<void> {
  try {
    const restaurant = await Restaurant.findById(req.user!.id).select('notificationPreferences').lean();
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    res.json({ preferences: normalizeNotificationPreferences(restaurant.notificationPreferences) });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ message: 'Server error fetching notification preferences' });
  }
}

/**
 * PATCH /restaurant/notification-preferences
 * Body: any subset of the preference keys, each a boolean
 */
export async function updateNotificationPreferences(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const unknownKeys = Object.keys(body).filter(
      (key) => !RESTAURANT_NOTIFICATION_KEYS.includes(key as RestaurantNotificationKey)
    );
    if (unknownKeys.length) {
      res.status(400).json({ message: `Unknown preference: ${unknownKeys.join(', ')}` });
      return;
    }

    const set: Record<string, boolean> = {};
    for (const key of RESTAURANT_NOTIFICATION_KEYS) {
      if (body[key] === undefined) continue;
      if (typeof body[key] !== 'boolean') {
        res.status(400).json({ message: `${key} must be true or false` });
        return;
      }
      set[`notificationPreferences.${key}`] = body[key] as boolean;
    }

    if (Object.keys(set).length === 0) {
      res.status(400).json({ message: 'Provide at least one preference field' });
      return;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user!.id,
      { $set: set },
      { returnDocument: 'after' }
    )
      .select('notificationPreferences')
      .lean();

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    res.json({ preferences: normalizeNotificationPreferences(restaurant.notificationPreferences) });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: 'Server error updating notification preferences' });
  }
}

// ========== Push Tokens ==========


function readPushToken(req: AuthRequest, res: Response): string | null {
  const { token } = (req.body ?? {}) as { token?: unknown };
  if (typeof token !== 'string' || !isExpoPushToken(token)) {
    res.status(400).json({ message: 'A valid Expo push token is required' });
    return null;
  }
  return token;
}

/**
 * POST /restaurant/push-token
 * Body: { token } — registers this device for push notifications
 */
export async function registerPushToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = readPushToken(req, res);
    if (!token) return;

    const found = await claimPushToken('restaurant', req.user!.id, token);
    if (!found) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    res.json({ registered: true });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ message: 'Server error registering push token' });
  }
}

/**
 * DELETE /restaurant/push-token
 * Body: { token } — stops push notifications to this device (called on sign out)
 */
export async function unregisterPushToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = readPushToken(req, res);
    if (!token) return;

    await releasePushToken('restaurant', req.user!.id, token);
    res.json({ registered: false });
  } catch (error) {
    console.error('Unregister push token error:', error);
    res.status(500).json({ message: 'Server error removing push token' });
  }
}

// ========== Orders ==========

/**
 * GET /restaurant/orders
 * Query params: status, page, limit
 */
export async function getOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const restaurantId = req.user!.id;
    const { status, page = '1', limit = '20' } = req.query;

    const query: Record<string, any> = { restaurant: restaurantId };
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
}

/**
 * GET /restaurant/orders/:id
 */
export async function getOrderDetail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const order = await Order.findOne({
      _id: req.params.id as string,
      restaurant: req.user!.id,
    }).populate('customer', 'name email phone');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
}

/**
 * PUT /restaurant/orders/:id/status
 * Body: { status: "Confirmed" | "Preparing" | "Ready" }
 */
export async function updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status, note } = req.body;

    const allowedTransitions: Record<string, string[]> = {
      Pending: ['Confirmed', 'Cancelled'],
      Confirmed: ['Preparing'],
      Preparing: ['Ready'],
    };

    const order = await Order.findOne({
      _id: req.params.id as string,
      restaurant: req.user!.id,
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const allowed = allowedTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}`,
      });
      return;
    }

    await order.updateStatus(status, note);
    void notifyOrderStatus(order, status);

    res.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
}

// ========== Menu ==========

/**
 * GET /restaurant/menu
 */
export async function getMenu(req: AuthRequest, res: Response): Promise<void> {
  try {
    let menu = await Menu.findOne({ restaurant: req.user!.id });

    if (!menu) {
      // Create an empty menu if none exists
      menu = await Menu.create({
        restaurant: req.user!.id,
        categories: [],
        items: [],
      });
    }

    res.json({ menu });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ message: 'Server error fetching menu' });
  }
}

/**
 * POST /restaurant/menu/category
 * Body: { name, description? }
 */
export async function addCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    let menu = await Menu.findOne({ restaurant: req.user!.id });

    if (!menu) {
      menu = await Menu.create({
        restaurant: req.user!.id,
        categories: [],
        items: [],
      });
    }

    const updatedMenu = await menu.addCategory(req.body);
    res.status(201).json({ menu: updatedMenu });
  } catch (error: any) {
    if (error.message === 'Category already exists') {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Add category error:', error);
    res.status(500).json({ message: 'Server error adding category' });
  }
}

/**
 * POST /restaurant/menu/item
 */
export async function addMenuItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    let menu = await Menu.findOne({ restaurant: req.user!.id });

    if (!menu) {
      res.status(404).json({ message: 'Menu not found. Create a category first.' });
      return;
    }

    const updatedMenu = await menu.addItem(req.body);
    res.status(201).json({ menu: updatedMenu });
  } catch (error: any) {
    if (error.message === 'Category does not exist') {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Add menu item error:', error);
    res.status(500).json({ message: 'Server error adding menu item' });
  }
}

/**
 * PUT /restaurant/menu/item/:id
 */
export async function updateMenuItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const menu = await Menu.findOne({ restaurant: req.user!.id });

    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    const updatedMenu = await menu.updateItem(req.params.id as string, req.body);
    res.json({ menu: updatedMenu });
  } catch (error: any) {
    if (error.message === 'Item not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error updating menu item' });
  }
}

/**
 * DELETE /restaurant/menu/item/:id
 */
export async function deleteMenuItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const menu = await Menu.findOne({ restaurant: req.user!.id });

    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    const updatedMenu = await menu.removeItem(req.params.id as string);
    res.json({ menu: updatedMenu });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error deleting menu item' });
  }
}

/**
 * PUT /restaurant/menu/item/:id/availability
 * Body: { isAvailable: boolean }
 */
export async function toggleItemAvailability(req: AuthRequest, res: Response): Promise<void> {
  try {
    const menu = await Menu.findOne({ restaurant: req.user!.id });

    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    const { isAvailable } = req.body;
    const updatedMenu = await menu.updateItem(req.params.id as string, { isAvailable });
    res.json({ menu: updatedMenu });
  } catch (error: any) {
    if (error.message === 'Item not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error toggling availability' });
  }
}
