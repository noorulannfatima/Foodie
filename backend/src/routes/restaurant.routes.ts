import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getDashboard,
  getProfile,
  updateProfile,
  updateStatus,
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  getMenu,
  addCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
} from '../controllers/restaurant.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard
router.get('/dashboard', getDashboard);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/status', updateStatus);

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);
router.put('/orders/:id/status', updateOrderStatus);

// Menu
router.get('/menu', getMenu);
router.post('/menu/category', addCategory);
router.post('/menu/item', addMenuItem);
router.put('/menu/item/:id', updateMenuItem);
router.delete('/menu/item/:id', deleteMenuItem);
router.put('/menu/item/:id/availability', toggleItemAvailability);

export default router;
