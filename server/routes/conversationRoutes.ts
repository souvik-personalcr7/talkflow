import express from 'express';
import { createOrGetConversation, getConversations, getConversation, toggleMuteConversation } from '../controllers/conversationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All conversation routes require authentication
router.use(protect);

router.route('/')
  .post(createOrGetConversation)
  .get(getConversations);

router.route('/:conversationId')
  .get(getConversation);

router.post('/:conversationId/mute', toggleMuteConversation);

export default router;
