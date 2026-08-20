import express from 'express';
import { createOrGetConversation, getConversations, getConversation } from '../controllers/conversationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All conversation routes require authentication
router.use(protect);

router.route('/')
  .post(createOrGetConversation)
  .get(getConversations);

router.route('/:conversationId')
  .get(getConversation);

export default router;
