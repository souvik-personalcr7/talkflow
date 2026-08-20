import { Router } from 'express';
import { getUsers, searchUsers, getUserById } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Order matters: /search must come before /:id so it doesn't get interpreted as an ID
router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserById);
router.get('/', protect, getUsers);

export default router;
