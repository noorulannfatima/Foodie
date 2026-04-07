import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Restaurant from '../models/restaurant';
import Menu from '../models/menu';
import Order from '../models/order';
import Cart from '../models/cart';
import User from '../models/user';

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
    const { restaurantId, menuItem, name, price, quantity, customizations, specialInstructions } = req.body;

    if (!restaurantId || !menuItem || !name || !price) {
      res.status(400).json({ message: 'Missing required fields: restaurantId, menuItem, name, price' });
      return;
    }

    // Get or create cart — this handles clearing if switching restaurants
    const cart = await (Cart as any).getOrCreateCart(req.user!.id, restaurantId);

    await cart.addItem({
      menuItem,
      name,
      price,
      quantity: quantity || 1,
      customizations: customizations || [],
      specialInstructions,
    });

    // Re-populate restaurant info
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
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({
      customer: req.user!.id,
      status: 'Active',
    });

    if (!cart) {
      res.status(404).json({ message: 'No active cart found' });
      return;
    }

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

    if (!deliveryAddress || !paymentMethod) {
      res.status(400).json({ message: 'Delivery address and payment method are required' });
      return;
    }

    // Get active cart
    const cart = await Cart.findOne({
      customer: req.user!.id,
      status: 'Active',
    }).populate('restaurant', 'deliveryFee estimatedDeliveryTime');

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    const restaurant = cart.restaurant as any;

    // Calculate pricing
    const subtotal = cart.subtotal;
    const deliveryFee = restaurant.deliveryFee || 0;
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const tipAmount = tip || 0;
    const total = subtotal + deliveryFee + tax + tipAmount;

    // Create the order
    const order = await Order.create({
      customer: req.user!.id,
      restaurant: cart.restaurant._id || cart.restaurant,
      items: cart.items.map((item) => ({
        menuItem: item.menuItem,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
      })),
      deliveryAddress,
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
      estimatedDeliveryTime: new Date(Date.now() + (restaurant.estimatedDeliveryTime || 30) * 60000),
      specialInstructions,
    });

    // Mark cart as completed
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
    const order = await Order.findOne({
      _id: req.params.id as string,
      customer: req.user!.id,
    }).populate('restaurant', 'name logo image phone address');

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
