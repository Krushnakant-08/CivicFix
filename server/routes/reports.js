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

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Submit a new civic issue report
 *     tags: [Reports]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category, location]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Pothole on Main Street
 *               description:
 *                 type: string
 *                 example: Deep pothole causing hazard near junction
 *               category:
 *                 type: string
 *                 enum: [roads, sanitation, water, electricity, parks, traffic, other]
 *               location:
 *                 type: object
 *                 properties:
 *                   address: { type: string }
 *                   lat: { type: number }
 *                   lng: { type: number }
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *               images:
 *                 type: array
 *                 items: { type: string, description: Base64 image string }
 *     responses:
 *       201:
 *         description: Report created — includes AI insights and tracking ID
 *       400:
 *         description: Validation error or spam detected
 *   get:
 *     summary: List all public reports
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of reports
 */
router.post('/', optionalAuth, createReport);
router.get('/', getReports);

/**
 * @swagger
 * /api/reports/track/{trackingId}:
 *   get:
 *     summary: Track a report by its tracking ID (public)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema: { type: string, example: CF-2024-000123 }
 *     responses:
 *       200:
 *         description: Report found
 *       404:
 *         description: Report not found
 */
router.get('/track/:trackingId', trackReport);

/**
 * @swagger
 * /api/reports/stats/overview:
 *   get:
 *     summary: Get report statistics overview (Admin)
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Summary stats by status, category, priority
 */
router.get('/stats/overview', protect, authorize('admin'), getReportStats);

/**
 * @swagger
 * /api/reports/analytics:
 *   get:
 *     summary: Full analytics dashboard data (Admin)
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Analytics data — trends, resolution times, breakdowns
 */
router.get('/analytics', protect, authorize('admin'), getAnalytics);

/**
 * @swagger
 * /api/reports/predictions:
 *   get:
 *     summary: Hotspot predictions based on report history (Admin)
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of predicted hotspot locations with confidence scores
 */
router.get('/predictions', protect, authorize('admin'), getPredictions);

/**
 * @swagger
 * /api/reports/my/reports:
 *   get:
 *     summary: Get current user's submitted reports
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User's reports with pagination
 */
router.get('/my/reports', protect, getMyReports);

/**
 * @swagger
 * /api/reports/{id}/upvote:
 *   put:
 *     summary: Toggle upvote on a report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Upvote toggled
 */
router.put('/:id/upvote', protect, upvoteReport);

/**
 * @swagger
 * /api/reports/{id}/status:
 *   put:
 *     summary: Update report status (Department / Admin)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [acknowledged, assigned, in_progress, resolved, closed, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id/status', protect, authorize('department', 'admin'), updateReportStatus);

/**
 * @swagger
 * /api/reports/{id}/assign:
 *   put:
 *     summary: Assign report to department (Admin)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedDepartment: { type: string }
 *               assignedTo: { type: string, description: User ID }
 *     responses:
 *       200:
 *         description: Report assigned
 */
router.put('/:id/assign', protect, authorize('admin'), assignReport);

/**
 * @swagger
 * /api/reports/{id}/analyze:
 *   post:
 *     summary: Re-run AI analysis on a report (Admin)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: AI analysis complete
 */
router.post('/:id/analyze', protect, authorize('admin'), reanalyzeReport);

/**
 * @swagger
 * /api/reports/map:
 *   get:
 *     summary: Get lightweight geo-data for map rendering (public)
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of report geo-points
 */
router.get('/map', getMapReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get a single report by ID
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full report object
 *       404:
 *         description: Report not found
 */
router.get('/:id', getReportById);

export default router;
