import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  getMe,
  patchOnline,
  patchProfile,
  patchPreferences,
  deleteAccount,
  getActiveOrder,
  getOrderRequests,
  getOrderHistory,
  acceptOrder,
  patchOrderStatus,
} from '../controllers/delivery.controller';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('delivery'));

router.get('/me', getMe);
router.patch('/me/profile', patchProfile);
router.patch('/me/preferences', patchPreferences);
router.delete('/me', deleteAccount);
router.patch('/online', patchOnline);
router.get('/orders/active', getActiveOrder);
router.get('/orders/requests', getOrderRequests);
router.get('/orders/history', getOrderHistory);
router.post('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/status', patchOrderStatus);

export default router;
