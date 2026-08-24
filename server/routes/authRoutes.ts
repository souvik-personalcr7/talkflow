import { Router } from 'express';
import { register, login, logout, getCurrentUser, forgotPassword, verifyResetOtp, resendResetOtp, resetPassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resendOtpSchema, resetPasswordSchema } from '../validators';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);

router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-otp', authLimiter, validate(verifyOtpSchema), verifyResetOtp);
router.post('/resend-reset-otp', otpLimiter, validate(resendOtpSchema), resendResetOtp);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
