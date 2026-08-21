import express from 'express';
import { getMessages } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get messages for a private conversation with another user
router.get('/:otherUserId', protect, getMessages);

export default router;
