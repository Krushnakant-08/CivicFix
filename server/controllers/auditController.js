import AuditLog from '../models/AuditLog.js';

/**
 * auditController — Phase 8.2
 * Handles blockchain audit trail endpoints for admins.
 */

// ─── GET /api/audit — Paginated list of all audit logs ──────
export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.reportId) filter.reportId = req.query.reportId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.role) filter['actor.role'] = req.query.role;

    // Date range filter
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ blockIndex: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor.userId', 'name email')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('AuditLog fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

// ─── GET /api/audit/report/:reportId — Logs for one report ──
export const getReportAuditTrail = async (req, res) => {
  try {
    const logs = await AuditLog.find({ reportId: req.params.reportId })
      .sort({ blockIndex: 1 })
      .populate('actor.userId', 'name email')
      .lean();

    res.json({ reportId: req.params.reportId, chain: logs });
  } catch (err) {
    console.error('Report audit fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch audit trail for this report' });
  }
};

// ─── GET /api/audit/verify — Verify full chain integrity ────
export const verifyAuditChain = async (req, res) => {
  try {
    const result = await AuditLog.verifyChain();
    const totalBlocks = await AuditLog.countDocuments();
    res.json({
      ...result,
      totalBlocks,
      verifiedAt: new Date().toISOString(),
      message: result.valid
        ? `✅ Chain is intact — ${totalBlocks} blocks verified`
        : `❌ Chain broken at block #${result.brokenAt}`,
    });
  } catch (err) {
    console.error('Chain verification error:', err);
    res.status(500).json({ message: 'Chain verification failed' });
  }
};

// ─── GET /api/audit/stats — Summary stats for the audit panel
export const getAuditStats = async (req, res) => {
  try {
    const [total, byAction] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ totalEntries: total, byAction });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit stats' });
  }
};
