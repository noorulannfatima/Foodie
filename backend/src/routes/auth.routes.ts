import { Router } from 'express';
import {
  signup,
  login,
  verifyToken,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Signup & Login for each role
router.post('/:role/signup', signup);
router.post('/:role/login', login);

// Password reset (request a code, then reset with that code)
router.post('/:role/forgot-password', forgotPassword);
router.post('/:role/reset-password', resetPassword);

// Verify token (protected)
router.get('/verify', authMiddleware, verifyToken);

export default router;
