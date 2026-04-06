import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUserRole,
  toggleUserStatus,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected — any authenticated user
router.put('/profile', protect, updateProfile);

// Admin only
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/:id/status', protect, authorize('admin'), toggleUserStatus);

export default router;
