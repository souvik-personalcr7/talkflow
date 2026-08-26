import express from 'express';
import { getMessages, uploadImage, uploadFile, deleteMessage } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';
import { upload, uploadFileMiddleware } from '../middleware/uploadMiddleware';

const router = express.Router();

// Upload an image message
router.post('/upload-image', protect, upload.single('image'), uploadImage);

// Upload a generic file message
router.post('/upload-file', protect, uploadFileMiddleware.single('file'), uploadFile);

// Get messages for a private conversation with another user
router.get('/:otherUserId', protect, getMessages);

// Delete a message
router.delete('/:messageId', protect, deleteMessage);

export default router;
