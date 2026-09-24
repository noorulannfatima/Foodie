import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadImageHandler } from '../controllers/upload.controller';

const router = Router();

// Any signed-in user (customer, restaurant, delivery) can upload images
router.use(authMiddleware);

router.post('/image', uploadImageHandler);

export default router;
