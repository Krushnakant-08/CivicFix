import express from 'express';
import {
  createReport,
  getReports,
  getReportById,
  trackReport,
  getMyReports,
  updateReportStatus,
  assignReport,
  upvoteReport,
  getReportStats,
  reanalyzeReport,
} from '../controllers/reportController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

// ─── Public / Optional Auth ──────────────────────────────
router.post('/', optionalAuth, createReport);         // Create report (anonymous allowed)
router.get('/', getReports);                           // List all reports (public feed)
router.get('/track/:trackingId', trackReport);         // Track by tracking ID (public)
router.get('/stats/overview', protect, authorize('admin'), getReportStats);  // Admin stats

// ─── Authenticated ───────────────────────────────────────
router.get('/my/reports', protect, getMyReports);      // My reports
router.put('/:id/upvote', protect, upvoteReport);      // Upvote toggle

// ─── Department / Admin ──────────────────────────────────
router.put('/:id/status', protect, authorize('department', 'admin'), updateReportStatus);
router.put('/:id/assign', protect, authorize('admin'), assignReport);
router.post('/:id/analyze', protect, authorize('admin'), reanalyzeReport);  // AI re-analysis

// ─── Single report (must be last — :id catch-all) ────────
router.get('/:id', getReportById);

export default router;
