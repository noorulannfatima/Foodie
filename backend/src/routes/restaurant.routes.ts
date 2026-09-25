import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  getDashboard,
  getProfile,
  updateProfile,
  updateStatus,
  getNotificationPreferences,
  updateNotificationPreferences,
  registerPushToken,
  unregisterPushToken,
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
import { getRestaurantReviews } from '../controllers/review.controller';
import {
  getPayoutSummary,
  getPayoutHistory,
  getPayoutDetail,
  updatePayoutAccount,
} from '../controllers/restaurantPayout.controller';

const router = Router();

// All routes require an authenticated restaurant account
router.use(authMiddleware);
router.use(requireRole('restaurant'));

// Dashboard
router.get('/dashboard', getDashboard);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/status', updateStatus);

// Notification preferences
router.get('/notification-preferences', getNotificationPreferences);
router.patch('/notification-preferences', updateNotificationPreferences);

// Push notification devices
router.post('/push-token', registerPushToken);
router.delete('/push-token', unregisterPushToken);

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);
router.put('/orders/:id/status', updateOrderStatus);

// Reviews
router.get('/reviews', getRestaurantReviews);

// Payouts & billing (summary/account before :id so they aren't read as ids)
router.get('/payouts/summary', getPayoutSummary);
router.put('/payouts/account', updatePayoutAccount);
router.get('/payouts', getPayoutHistory);
router.get('/payouts/:id', getPayoutDetail);

// Menu
router.get('/menu', getMenu);
router.post('/menu/category', addCategory);
router.post('/menu/item', addMenuItem);
router.put('/menu/item/:id', updateMenuItem);
router.delete('/menu/item/:id', deleteMenuItem);
router.put('/menu/item/:id/availability', toggleItemAvailability);

export default router;
