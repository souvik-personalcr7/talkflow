import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { aiPromptSchema } from '../validators';
import { handleAIChat, handleAIChatStream } from '../controllers/aiController';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting: max 15 requests per minute
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { success: false, error: 'Too many requests, please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', protect, aiRateLimiter, validate(aiPromptSchema), handleAIChat);
router.post('/chat/stream', protect, aiRateLimiter, validate(aiPromptSchema), handleAIChatStream);

export default router;
