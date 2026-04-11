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
  getMapReports,
  getAnalytics,
  getPredictions,
} from '../controllers/reportController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

// ─── Public / Optional Auth ──────────────────────────────
router.post('/', optionalAuth, createReport);         // Create report (anonymous allowed)
router.get('/', getReports);                           // List all reports (public feed)
router.get('/track/:trackingId', trackReport);         // Track by tracking ID (public)
router.get('/stats/overview', protect, authorize('admin'), getReportStats);  // Admin stats

// ─── Analytics & Predictions (Admin) ─────────────────────
router.get('/analytics', protect, authorize('admin'), getAnalytics);       // Analytics dashboard data
router.get('/predictions', protect, authorize('admin'), getPredictions);    // Hotspot predictions

// ─── Authenticated ───────────────────────────────────────
router.get('/my/reports', protect, getMyReports);      // My reports
router.put('/:id/upvote', protect, upvoteReport);      // Upvote toggle

// ─── Department / Admin ──────────────────────────────────
router.put('/:id/status', protect, authorize('department', 'admin'), updateReportStatus);
router.put('/:id/assign', protect, authorize('admin'), assignReport);
router.post('/:id/analyze', protect, authorize('admin'), reanalyzeReport);  // AI re-analysis

// ─── Map route ──────────────────────────────────────────
router.get('/map', getMapReports);  // Public — lightweight geo data

// ─── Single report (must be last — :id catch-all) ────────
router.get('/:id', getReportById);

export default router;

