import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  getHome,
  getRestaurantDetail,
  getMenuItemDetail,
  searchRestaurants,
  getCart,
  getCartSuggestions,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  createOrder,
  getOrders,
  getOrderDetail,
  getActiveOrders,
  cancelOrder,
  rollbackOrder,
  reorder,
  trackOrder,
} from '../controllers/customer.controller';
import { submitOrderReview, getMenuItemReviews } from '../controllers/review.controller';
import {
  getPreferences,
  updatePreferences,
  registerPushToken,
  unregisterPushToken,
} from '../controllers/customerPreferences.controller';
import {
  listAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from '../controllers/customerAddresses.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Home
router.get('/home', getHome);

// Preferences & push devices
router.get('/preferences', requireRole('customer'), getPreferences);
router.patch('/preferences', requireRole('customer'), updatePreferences);
router.post('/push-token', requireRole('customer'), registerPushToken);
router.delete('/push-token', requireRole('customer'), unregisterPushToken);

// Saved delivery addresses
router.get('/addresses', requireRole('customer'), listAddresses);
router.post('/addresses', requireRole('customer'), addAddress);
router.patch('/addresses/:id', requireRole('customer'), updateAddress);
router.delete('/addresses/:id', requireRole('customer'), deleteAddress);
router.post('/addresses/:id/default', requireRole('customer'), setDefaultAddress);

// Restaurants
router.get('/restaurants/:id', getRestaurantDetail);
router.get('/restaurants/:id/items/:itemId', getMenuItemDetail);
router.get('/restaurants/:id/items/:itemId/reviews', getMenuItemReviews);

// Search
router.get('/search', searchRestaurants);

// Cart
router.get('/cart', getCart);
router.get('/cart/suggestions', getCartSuggestions);
router.post('/cart/add', addToCart);
router.put('/cart/update', updateCartItem);
router.delete('/cart/item/:itemId', removeCartItem);
router.delete('/cart', clearCart);

// Orders
router.post('/orders', createOrder);
router.get('/orders', getOrders);
// Before /orders/:id so "active" isn't read as an order id
router.get('/orders/active', requireRole('customer'), getActiveOrders);
router.get('/orders/:id', getOrderDetail);

// Order actions
router.post('/orders/:id/cancel', cancelOrder);
router.post('/orders/:id/rollback', rollbackOrder);
router.post('/orders/:id/review', requireRole('customer'), submitOrderReview);
router.post('/orders/:id/reorder', reorder);
router.get('/orders/:id/track', trackOrder);

export default router;
