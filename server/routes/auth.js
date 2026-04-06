import express from 'express';
import { register, login, getMe, createStaffAccount } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Admin-only routes
router.post('/create-staff', protect, authorize('admin'), createStaffAccount);

export default router;
