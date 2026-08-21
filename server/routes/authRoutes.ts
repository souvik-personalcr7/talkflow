import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);

export default router;
