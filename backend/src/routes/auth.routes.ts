import { Router } from 'express';
import { signup, login, verifyToken } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Signup & Login for each role
router.post('/:role/signup', signup);
router.post('/:role/login', login);

// Verify token (protected)
router.get('/verify', authMiddleware, verifyToken);

export default router;
