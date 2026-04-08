import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  getMe,
  patchOnline,
  getActiveOrder,
  getOrderRequests,
  getOrderHistory,
  acceptOrder,
} from '../controllers/delivery.controller';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('delivery'));

router.get('/me', getMe);
router.patch('/online', patchOnline);
router.get('/orders/active', getActiveOrder);
router.get('/orders/requests', getOrderRequests);
router.get('/orders/history', getOrderHistory);
router.post('/orders/:id/accept', acceptOrder);

export default router;
