import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Restaurant from '../models/restaurant';
import Menu from '../models/menu';
import Order from '../models/order';
import Cart from '../models/cart';
import User from '../models/user';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Look up a single menu item across the restaurant's menu document. Returns
 * the embedded sub-document so we can read the canonical name/price/availability
 * straight from the database — never trust prices from the client.
 */
async function findMenuItem(restaurantId: string, menuItemId: string) {
  const menu = await Menu.findOne({ restaurant: restaurantId });
  if (!menu) return null;
  return menu.items.find((it: any) => it._id.toString() === menuItemId) || null;
}

/**
 * Computes the additional cost contributed by customizations.
 * Mirrors the logic embedded in cart.addItem so the controller can validate
 * before hitting the model.
 */
function customizationsTotal(customizations?: any[]): number {
  if (!customizations) return 0;
  return customizations.reduce(
    (sum, c) =>
      sum +
      (c.selectedOptions || []).reduce((s: number, o: any) => s + (Number(o.price) || 0), 0),
    0,
  );
}

/** Standard 5% tax rule, kept in one place. */
function calcTax(subtotal: number): number {
  return Math.round(subtotal * 0.05 * 100) / 100;
}

// ========== Home ==========

/**
 * GET /api/customer/home
 * Returns featured restaurants, categories, and all open restaurants
 */
export async function getHome(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Featured / popular restaurants (top rated, active, verified optional)
    const popularRestaurants = await Restaurant.find({ isActive: true })
      .sort({ averageRating: -1, totalOrders: -1 })
      .limit(6)
      .select('name cuisineTypes image logo averageRating deliveryFee estimatedDeliveryTime isPremium minimumOrder isActive isBusy');

    // All open restaurants
    const allRestaurants = await Restaurant.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('name cuisineTypes image logo averageRating deliveryFee estimatedDeliveryTime isPremium minimumOrder isActive isBusy');

    // Extract unique cuisine types for categories
    const cuisineSet = new Set<string>();
    allRestaurants.forEach((r) => {
      r.cuisineTypes.forEach((c) => cuisineSet.add(c));
    });
    const categories = Array.from(cuisineSet).slice(0, 12);

    res.json({
      popularRestaurants,
      allRestaurants,
      categories,
    });
  } catch (error) {
    console.error('Home error:', error);
    res.status(500).json({ message: 'Server error fetching home data' });
  }
}

// ========== Restaurant Detail ==========

/**
 * GET /api/customer/restaurants/:id
 * Returns full restaurant details with its menu grouped by category
 */
export async function getRestaurantDetail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const restaurant = await Restaurant.findById(req.params.id as string)
      .select('-password -reviews');

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Get the restaurant's menu
    const menu = await Menu.findOne({ restaurant: restaurant._id });

    // Group items by category
    const menuByCategory: Record<string, any[]> = {};
    if (menu) {
      for (const cat of menu.categories) {
        menuByCategory[cat.name] = menu.items.filter((item) => item.category === cat.name);
      }
    }

    res.json({
      restaurant,
      menu: menu ? {
        _id: menu._id,
        categories: menu.categories,
        items: menu.items,
        menuByCategory,
      } : null,
    });
  } catch (error) {
    console.error('Restaurant detail error:', error);
    res.status(500).json({ message: 'Server error fetching restaurant' });
  }
}

// ========== Search ==========

/**
 * GET /api/customer/search?query=xxx
 * Search restaurants by name, cuisine, or menu items
 */
export async function searchRestaurants(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.json({ restaurants: [] });
      return;
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    // Search restaurants by name or cuisine
    const restaurants = await Restaurant.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { cuisineTypes: searchRegex },
        { description: searchRegex },
      ],
    })
      .sort({ averageRating: -1 })
      .limit(20)
      .select('name cuisineTypes image logo averageRating deliveryFee estimatedDeliveryTime isPremium minimumOrder isActive isBusy');

    // Also search menu items for matching dishes
    const menus = await Menu.find({
      'items.name': searchRegex,
    }).populate('restaurant', 'name cuisineTypes image logo averageRating deliveryFee estimatedDeliveryTime isPremium minimumOrder isActive isBusy');

    // Merge restaurant results (dedup by id)
    const resultMap = new Map<string, any>();
    restaurants.forEach((r) => resultMap.set(r._id.toString(), r));
    menus.forEach((m) => {
      if (m.restaurant && !resultMap.has((m.restaurant as any)._id.toString())) {
        resultMap.set((m.restaurant as any)._id.toString(), m.restaurant);
      }
    });

    res.json({ restaurants: Array.from(resultMap.values()) });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error searching' });
  }
}

// ========== Cart ==========

/**
 * GET /api/customer/cart
 * Get the user's active cart
 */
export async function getCart(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cart = await Cart.findOne({
      customer: req.user!.id,
      status: 'Active',
    }).populate('restaurant', 'name logo minimumOrder deliveryFee estimatedDeliveryTime');

    res.json({ cart: cart || null });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
}

/**
 * POST /api/customer/cart/add
 * Add a menu item to the cart
 * Body: { restaurantId, menuItem, name, price, quantity, customizations?, specialInstructions? }
 */
export async function addToCart(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { restaurantId, menuItem, quantity, customizations, specialInstructions } = req.body;

    if (!restaurantId || !menuItem) {
      res.status(400).json({ message: 'restaurantId and menuItem are required' });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(restaurantId) ||
      !mongoose.Types.ObjectId.isValid(menuItem)
    ) {
      res.status(400).json({ message: 'Invalid restaurantId or menuItem' });
      return;
    }

    const qty = Math.max(1, Number(quantity) || 1);

    // Verify the restaurant exists and is currently accepting orders.
    const restaurant = await Restaurant.findById(restaurantId).select(
      'isActive isBusy name logo minimumOrder deliveryFee estimatedDeliveryTime',
    );
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    if (!restaurant.isActive || restaurant.isBusy) {
      res.status(409).json({ message: 'Restaurant is not accepting orders right now' });
      return;
    }

    // Look up the canonical menu item — we use the price/name from DB, not
    // whatever the client sent, so a malicious client can't pay a discounted
    // price they invented.
    const item = await findMenuItem(restaurantId, menuItem);
    if (!item) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }
    if (!item.isAvailable) {
      res.status(409).json({ message: `${item.name} is currently unavailable` });
      return;
    }

    // Get or create cart — this handles clearing if switching restaurants.
    const cart = await (Cart as any).getOrCreateCart(req.user!.id, restaurantId);

    // Use the discounted price if one is set; otherwise the base price.
    const unitPrice =
      typeof item.discountedPrice === 'number' && item.discountedPrice >= 0
        ? item.discountedPrice
        : item.price;

    await cart.addItem({
      menuItem,
      name: item.name,
      price: unitPrice,
      quantity: qty,
      customizations: customizations || [],
      specialInstructions,
    });

    await cart.populate('restaurant', 'name logo minimumOrder deliveryFee estimatedDeliveryTime');

    res.json({ cart });
  } catch (error: any) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: error.message || 'Server error adding to cart' });
  }
}

/**
 * PUT /api/customer/cart/update
 * Body: { itemId, quantity }
 */
export async function updateCartItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { itemId } = req.body;
    const quantity = Number(req.body.quantity);

    if (!itemId || Number.isNaN(quantity)) {
      res.status(400).json({ message: 'itemId and a numeric quantity are required' });
      return;
    }

    const cart = await Cart.findOne({
      customer: req.user!.id,
      status: 'Active',
    });

    if (!cart) {
      res.status(404).json({ message: 'No active cart found' });
      return;
    }

    // updateItemQuantity already removes the item when quantity <= 0.
    await cart.updateItemQuantity(itemId, quantity);
    await cart.populate('restaurant', 'name logo minimumOrder deliveryFee estimatedDeliveryTime');

    res.json({ cart });
  } catch (error: any) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: error.message || 'Server error updating cart' });
  }
}

/**
 * DELETE /api/customer/cart/item/:itemId
 * Remove a single item from cart
 */
export async function removeCartItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cart = await Cart.findOne({
      customer: req.user!.id,
      status: 'Active',
    });

    if (!cart) {
      res.status(404).json({ message: 'No active cart found' });
      return;
    }

    await cart.removeItem(req.params.itemId as string);
    await cart.populate('restaurant', 'name logo minimumOrder deliveryFee estimatedDeliveryTime');

    res.json({ cart });
  } catch (error: any) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: error.message || 'Server error removing item' });
  }
}

/**
 * DELETE /api/customer/cart
 * Clear the entire cart
 */
export async function clearCart(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cart = await Cart.findOne({
      customer: req.user!.id,
      status: 'Active',
    });

    if (!cart) {
      res.status(404).json({ message: 'No active cart found' });
      return;
    }

    await cart.clearCart();
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error clearing cart' });
  }
}

// ========== Orders ==========

/**
 * POST /api/customer/orders
 * Create a new order from the active cart
 * Body: { deliveryAddress, paymentMethod, specialInstructions?, tip? }
 */
export async function createOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { deliveryAddress, paymentMethod, specialInstructions, tip } = req.body;

    // ----- Input validation ------------------------------------------------
    if (!deliveryAddress || !paymentMethod) {
      res.status(400).json({ message: 'Delivery address and payment method are required' });
      return;
    }

    const { street, city, zipCode } = deliveryAddress;
    if (!street || !city || !zipCode) {
      res.status(400).json({ message: 'Delivery address must include street, city, and zipCode' });
      return;
    }

    const allowedMethods = ['Cash', 'Card', 'Wallet', 'Online', 'Safepay'];
    if (!allowedMethods.includes(paymentMethod)) {
      res.status(400).json({ message: `paymentMethod must be one of: ${allowedMethods.join(', ')}` });
      return;
    }

    // ----- Load cart with full restaurant info -----------------------------
    const cart = await Cart.findOne({
      customer: req.user!.id,
      status: 'Active',
    }).populate('restaurant', 'name isActive isBusy minimumOrder deliveryFee estimatedDeliveryTime');

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    const restaurant = cart.restaurant as any;

    // The restaurant could have gone offline between adding-to-cart and
    // checkout, so re-check just before we accept the order.
    if (!restaurant?.isActive || restaurant.isBusy) {
      res.status(409).json({ message: 'Restaurant is not accepting orders right now' });
      return;
    }

    if (cart.subtotal < (restaurant.minimumOrder || 0)) {
      res.status(400).json({
        message: `Minimum order amount is ${restaurant.minimumOrder}. Your subtotal is ${cart.subtotal}.`,
      });
      return;
    }

    // ----- Re-validate menu items (server source of truth) -----------------
    // If a menu item was removed or made unavailable while the cart sat
    // around, fail fast rather than charge the customer for nothing.
    const menu = await Menu.findOne({ restaurant: restaurant._id });
    if (!menu) {
      res.status(409).json({ message: 'Restaurant menu is no longer available' });
      return;
    }

    for (const cartItem of cart.items) {
      const dbItem = menu.items.find(
        (it: any) => it._id.toString() === cartItem.menuItem.toString(),
      );
      if (!dbItem || !dbItem.isAvailable) {
        res.status(409).json({
          message: `${cartItem.name} is no longer available — please update your cart`,
        });
        return;
      }
    }

    // ----- Pricing (computed, never trusted from client) -------------------
    const subtotal = cart.subtotal;
    const deliveryFee = restaurant.deliveryFee || 0;
    const tax = calcTax(subtotal);
    const tipAmount = Math.max(0, Number(tip) || 0);
    const total = subtotal + deliveryFee + tax + tipAmount;

    // ----- Persist (atomic-ish: create order, then close cart) -------------
    const order = await Order.create({
      customer: req.user!.id,
      restaurant: restaurant._id,
      items: cart.items.map((item) => ({
        menuItem: item.menuItem,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
      })),
      deliveryAddress: {
        street,
        city,
        zipCode,
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
        instructions: deliveryAddress.instructions,
      },
      pricing: {
        subtotal,
        deliveryFee,
        tax,
        discount: 0,
        tip: tipAmount,
        total,
      },
      payment: {
        method: paymentMethod,
        status: 'Pending',
      },
      status: 'Pending',
      estimatedPreparationTime: restaurant.estimatedDeliveryTime || 30,
      estimatedDeliveryTime: new Date(
        Date.now() + (restaurant.estimatedDeliveryTime || 30) * 60000,
      ),
      specialInstructions,
    });

    // Mark the cart as completed so the next addToCart starts fresh.
    cart.status = 'Completed';
    await cart.save();

    res.status(201).json({ order });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
}

/**
 * GET /api/customer/orders
 * List customer's orders (active and past)
 */
export async function getOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const query: Record<string, any> = { customer: req.user!.id };
    if (status && typeof status === 'string') {
      query.status = status;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('restaurant', 'name logo image')
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
 * GET /api/customer/orders/:id
 * Get single order detail
 */
export async function getOrderDetail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'Invalid order id' });
      return;
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user!.id,
    })
      .populate('restaurant', 'name logo image phone address')
      .populate('deliveryPerson', 'name phone vehicle');

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

// ---------------------------------------------------------------------------
// Order actions: cancel, rate, reorder, track
// ---------------------------------------------------------------------------

/**
 * POST /api/customer/orders/:id/cancel
 * Body: { reason?: string }
 *
 * Customer-initiated cancellation. Only allowed while the order is in an
 * early status (Pending / Confirmed / Preparing) — once it's out for delivery
 * the kitchen has already paid for the food and we shouldn't refund it
 * silently.
 */
export async function cancelOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'Invalid order id' });
      return;
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!order.canBeCancelled()) {
      res.status(409).json({
        message: `Order in status "${order.status}" can no longer be cancelled`,
      });
      return;
    }

    order.status = 'Cancelled';
    order.cancellationReason = reason || 'Cancelled by customer';
    order.timeline.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: order.cancellationReason,
    });

    // If the customer had already paid online, mark the payment for refund.
    // The actual refund to the gateway is a separate concern (Safepay
    // dashboard or an admin job).
    if (order.payment.status === 'Completed') {
      order.payment.status = 'Refunded';
    } else {
      order.payment.status = 'Failed';
    }

    await order.save();
    res.json({ order });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: error.message || 'Server error cancelling order' });
  }
}

/**
 * POST /api/customer/orders/:id/rate
 * Body: { restaurant: 1-5, delivery: 1-5, food: 1-5, comment?: string }
 *
 * Lets the customer rate a delivered order. Saves the rating on the order
 * and pushes it onto the restaurant's `reviews` array (with rating + comment),
 * which keeps both the per-order audit trail and the aggregated restaurant
 * rating up to date.
 */
export async function rateOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;
    const { restaurant, delivery, food, comment } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'Invalid order id' });
      return;
    }

    const ratings = [restaurant, delivery, food].map((v) => Number(v));
    if (ratings.some((v) => Number.isNaN(v) || v < 1 || v > 5)) {
      res
        .status(400)
        .json({ message: 'restaurant, delivery, and food ratings (1-5) are required' });
      return;
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.status !== 'Delivered') {
      res.status(409).json({ message: 'Only delivered orders can be rated' });
      return;
    }
    if (order.customerRating?.ratedAt) {
      res.status(409).json({ message: 'Order has already been rated' });
      return;
    }

    await order.addRating({
      restaurant: ratings[0],
      delivery: ratings[1],
      food: ratings[2],
      comment,
    });

    // Mirror the food rating into the restaurant's review list so it bubbles
    // up to the average rating used in search/listings.
    const restaurantDoc = await Restaurant.findById(order.restaurant);
    if (restaurantDoc) {
      await restaurantDoc.addReview({
        user: req.user!.id,
        rating: ratings[2], // food rating drives restaurant aggregate
        comment,
      });
    }

    res.json({ order });
  } catch (error: any) {
    console.error('Rate order error:', error);
    res.status(500).json({ message: error.message || 'Server error rating order' });
  }
}

/**
 * POST /api/customer/orders/:id/reorder
 *
 * Re-creates an active cart from a past order's items. Useful for the
 * "Order again" button on the orders list. Items that are no longer
 * available on the restaurant menu are silently skipped, and we tell the
 * client which ones were dropped so it can show a hint.
 */
export async function reorder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'Invalid order id' });
      return;
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const restaurant = await Restaurant.findById(order.restaurant).select(
      'isActive isBusy name logo minimumOrder deliveryFee estimatedDeliveryTime',
    );
    if (!restaurant || !restaurant.isActive || restaurant.isBusy) {
      res.status(409).json({ message: 'Restaurant is not accepting orders right now' });
      return;
    }

    const menu = await Menu.findOne({ restaurant: order.restaurant });
    if (!menu) {
      res.status(409).json({ message: 'Restaurant menu is no longer available' });
      return;
    }

    // Get-or-create a fresh active cart for this restaurant.
    const cart = await (Cart as any).getOrCreateCart(
      req.user!.id,
      order.restaurant.toString(),
    );

    // Replay order items, skipping anything no longer on the menu / available.
    const skipped: string[] = [];
    for (const oi of order.items) {
      const dbItem = menu.items.find((it: any) => it._id.toString() === oi.menuItem.toString());
      if (!dbItem || !dbItem.isAvailable) {
        skipped.push(oi.name);
        continue;
      }

      const unitPrice =
        typeof dbItem.discountedPrice === 'number' && dbItem.discountedPrice >= 0
          ? dbItem.discountedPrice
          : dbItem.price;

      await cart.addItem({
        menuItem: oi.menuItem,
        name: dbItem.name,
        price: unitPrice,
        quantity: oi.quantity,
        customizations: oi.customizations || [],
        specialInstructions: oi.specialInstructions,
      });
    }

    await cart.populate('restaurant', 'name logo minimumOrder deliveryFee estimatedDeliveryTime');

    res.json({ cart, skipped });
  } catch (error: any) {
    console.error('Reorder error:', error);
    res.status(500).json({ message: error.message || 'Server error reordering' });
  }
}

/**
 * GET /api/customer/orders/:id/track
 *
 * Lightweight endpoint for the order-tracking screen — returns just the
 * status, the timeline, and the live ETA. Avoids re-shipping the entire
 * order document on every poll.
 */
export async function trackOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'Invalid order id' });
      return;
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user!.id,
    })
      .select(
        'orderNumber status timeline estimatedDeliveryTime actualDeliveryTime deliveryPerson payment.status',
      )
      .populate('deliveryPerson', 'name phone vehicle currentLocation');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment.status,
      timeline: order.timeline,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      deliveryPerson: order.deliveryPerson,
    });
  } catch (error: any) {
    console.error('Track order error:', error);
    res.status(500).json({ message: error.message || 'Server error tracking order' });
  }
}
