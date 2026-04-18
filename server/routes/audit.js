import express from 'express';
import {
  getAuditLogs,
  getReportAuditTrail,
  verifyAuditChain,
  getAuditStats,
} from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All audit routes are admin-only
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get paginated audit logs
 *     tags: [Audit]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: reportId
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *       401:
 *         description: Unauthorized
 */
router.get('/', getAuditLogs);

/**
 * @swagger
 * /api/audit/verify:
 *   get:
 *     summary: Verify blockchain chain integrity
 *     tags: [Audit]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Chain verification result
 */
router.get('/verify', verifyAuditChain);

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Get audit log statistics
 *     tags: [Audit]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats', getAuditStats);

/**
 * @swagger
 * /api/audit/report/{reportId}:
 *   get:
 *     summary: Get audit trail for a specific report
 *     tags: [Audit]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: string }
 */
router.get('/report/:reportId', getReportAuditTrail);

export default router;
