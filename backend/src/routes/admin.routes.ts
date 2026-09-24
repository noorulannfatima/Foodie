import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  getOverview,
  getRestaurants,
  updateCommission,
  reviewPayoutAccount,
  generatePayouts,
  getPayouts,
  getPayout,
  markPaid,
  markFailed,
} from '../controllers/admin.controller';

const router = Router();

// All routes require an authenticated admin account
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/overview', getOverview);

// Restaurants
router.get('/restaurants', getRestaurants);
router.patch('/restaurants/:id/commission', updateCommission);
router.patch('/restaurants/:id/payout-account', reviewPayoutAccount);

// Payouts
router.post('/payouts/generate', generatePayouts);
router.get('/payouts', getPayouts);
router.get('/payouts/:id', getPayout);
router.patch('/payouts/:id/paid', markPaid);
router.patch('/payouts/:id/failed', markFailed);

export default router;
