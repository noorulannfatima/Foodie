import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getHome,
  getRestaurantDetail,
  searchRestaurants,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  createOrder,
  getOrders,
  getOrderDetail,
} from '../controllers/customer.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Home
router.get('/home', getHome);

// Restaurants
router.get('/restaurants/:id', getRestaurantDetail);

// Search
router.get('/search', searchRestaurants);

// Cart
router.get('/cart', getCart);
router.post('/cart/add', addToCart);
router.put('/cart/update', updateCartItem);
router.delete('/cart/item/:itemId', removeCartItem);
router.delete('/cart', clearCart);

// Orders
router.post('/orders', createOrder);
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);

export default router;
