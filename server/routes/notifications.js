import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/notifications — list notifications (paginated)
router.get('/', getNotifications);

// GET /api/notifications/unread-count — get unread count
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', markAsRead);

// DELETE /api/notifications — clear all read notifications
router.delete('/', clearReadNotifications);

// DELETE /api/notifications/:id — delete single notification
router.delete('/:id', deleteNotification);

export default router;
