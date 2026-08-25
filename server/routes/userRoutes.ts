import { Router } from 'express';
import { getUsers, searchUsers, getUserById, uploadProfilePicture, removeProfilePicture } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Profile picture routes
router.post('/profile-picture', protect, upload.single('profileImage'), uploadProfilePicture);
router.delete('/profile-picture', protect, removeProfilePicture);

// Order matters: /search must come before /:id so it doesn't get interpreted as an ID
router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserById);
router.get('/', protect, getUsers);

export default router;
