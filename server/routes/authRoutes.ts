import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);

export default router;
