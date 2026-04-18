import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { emitToUser, emitToDepartment, broadcast } from '../socket.js';
import { analyzeReport } from '../services/aiService.js';

/**
 * Fire-and-forget audit entry — never blocks the main response
 */
async function auditLog(reportId, action, actor = {}, metadata = {}) {
  try {
    await AuditLog.createEntry({ reportId, action, actor, metadata });
  } catch (err) {
    // Non-blocking — audit failure must never break the API
    console.error('[AuditLog] Failed to write entry:', err.message);
  }
}

// ─── Department mapping for auto-routing ─────────────────
const CATEGORY_TO_DEPARTMENT = {
  roads: 'roads',
  sanitation: 'sanitation',
  water: 'water',
  electricity: 'electricity',
  parks: 'parks',
  traffic: 'traffic',
  other: 'general',
};

/**
 * @route   POST /api/reports
 * @desc    Create a new report
 * @access  Public (optionalAuth — anonymous or logged in)
 */
export const createReport = async (req, res) => {
  try {
    const { title, description, category, location, isAnonymous, images } = req.body;

    // Generate unique tracking ID
    const trackingId = await Report.generateTrackingId();

    // ─── Phase 5: AI Analysis ──────────────────────────
    let aiResult;
    try {
      aiResult = await analyzeReport(title, description, category);
    } catch (aiErr) {
      console.error('AI analysis failed (non-blocking):', aiErr);
      aiResult = null;
    }

    // Spam check — reject if score is too high
    if (aiResult?.spam?.isSpam) {
      return res.status(400).json({
        message: `Report flagged as low quality: ${aiResult.spam.reason || 'Content does not meet quality standards'}`,
        spam: true,
      });
    }

    // Use AI-suggested department if it overrode the category mapping
    const assignedDepartment = aiResult?.departmentOverridden
      ? aiResult.department
      : (CATEGORY_TO_DEPARTMENT[category] || 'general');

    const report = await Report.create({
      trackingId,
      reporter: isAnonymous ? null : req.user?._id || null,
      isAnonymous: isAnonymous || !req.user,
      title,
      description,
      category,
      location: {
        address: location?.address || location,
        coordinates: {
          lat: location?.lat || null,
          lng: location?.lng || null,
        },
        ward: location?.ward || null,
      },
      images: images || [],
      assignedDepartment,
      // AI-populated fields
      priority: aiResult?.priority || 'medium',
      severity: aiResult?.severity || 5,
      aiTags: aiResult?.tags || [],
      aiConfidence: aiResult?.confidence || null,
      isDuplicate: aiResult?.duplicate?.isDuplicate || false,
      duplicateOf: aiResult?.duplicate?.duplicateOf || null,
      spamScore: aiResult?.spam?.score || 0,
      aiDepartmentSuggestion: aiResult ? {
        department: aiResult.department,
        overridden: aiResult.departmentOverridden,
      } : undefined,
      estimatedResolutionTime: aiResult?.estimatedResolution || null,
      statusHistory: [
        {
          status: 'reported',
          changedBy: req.user?._id || null,
          changedAt: new Date(),
          note: 'Report submitted',
        },
      ],
    });

    // ─── Phase 8.2: Blockchain Audit ──────────────────
    auditLog(report._id, 'REPORT_CREATED', {
      userId: req.user?._id,
      username: req.user?.name || 'anonymous',
      role: req.user?.role || 'citizen',
      ip: req.ip,
    }, { category, assignedDepartment, trackingId: report.trackingId });

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
      trackingId: report.trackingId,
      aiInsights: aiResult ? {
        tags: aiResult.tags,
        priority: aiResult.priority,
        severity: aiResult.severity,
        confidence: aiResult.confidence,
        departmentOverridden: aiResult.departmentOverridden,
        suggestedDepartment: aiResult.department,
        duplicate: aiResult.duplicate?.isDuplicate ? aiResult.duplicate.match : null,
        estimatedResolution: aiResult.estimatedResolution,
      } : null,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('CreateReport error:', error);
    res.status(500).json({ message: 'Server error creating report' });
  }
};

/**
 * @route   GET /api/reports
 * @desc    Get all reports with filtering, sorting, pagination
 * @access  Public
 */
export const getReports = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      department,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (department) filter.assignedDepartment = department;

    const reports = await Report.find(filter)
      .populate('reporter', 'name avatar')
      .populate('assignedTo', 'name department')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GetReports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/reports/track/:trackingId
 * @desc    Track a report by tracking ID (public)
 * @access  Public
 */
export const trackReport = async (req, res) => {
  try {
    const report = await Report.findOne({ trackingId: req.params.trackingId })
      .populate('assignedTo', 'name department')
      .populate('statusHistory.changedBy', 'name role');

    if (!report) {
      return res.status(404).json({ message: 'Report not found with this tracking ID' });
    }

    // If anonymous, don't expose reporter info
    const safeReport = report.toObject();
    if (safeReport.isAnonymous) {
      safeReport.reporter = null;
    }

    res.json({ report: safeReport });
  } catch (error) {
    console.error('TrackReport error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/reports/:id
 * @desc    Get single report by ID
 * @access  Public
 */
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name avatar')
      .populate('assignedTo', 'name department')
      .populate('statusHistory.changedBy', 'name role');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('GetReportById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/reports/my/reports
 * @desc    Get current user's reports
 * @access  Private
 */
export const getMyReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { reporter: req.user._id };
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GetMyReports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/reports/:id/status
 * @desc    Update report status (department/admin)
 * @access  Private (department, admin)
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const validStatuses = ['acknowledged', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || null,
    });

    // If resolved, set resolution timestamp
    if (status === 'resolved') {
      report.resolution.resolvedBy = req.user._id;
      report.resolution.resolvedAt = new Date();
    }

    await report.save();

    // ─── Phase 8.2: Blockchain Audit ──────────────────────
    auditLog(report._id, 'STATUS_CHANGED', {
      userId: req.user._id,
      username: req.user.name,
      role: req.user.role,
      ip: req.ip,
    }, { oldStatus: req.body.previousStatus, newStatus: status, note });

    // ─── Emit real-time notification to reporter ──────
    if (report.reporter) {
      const STATUS_LABELS = {
        acknowledged: 'Acknowledged',
        assigned: 'Assigned',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
        rejected: 'Rejected',
      };

      const notifType = status === 'resolved' ? 'report_resolved' : 'status_change';
      const notification = await Notification.createNotification({
        recipient: report.reporter,
        type: notifType,
        title: status === 'resolved'
          ? '🎉 Your report has been resolved!'
          : `Report status updated`,
        message: `Your report "${report.title}" (${report.trackingId}) is now ${STATUS_LABELS[status] || status}.${note ? ' Note: ' + note : ''}`,
        relatedReport: report._id,
        trackingId: report.trackingId,
        metadata: {
          oldStatus: req.body.previousStatus || null,
          newStatus: status,
          category: report.category,
          department: report.assignedDepartment,
          actionBy: req.user._id,
        },
      });

      // Push via WebSocket
      emitToUser(report.reporter.toString(), 'notification:new', notification);
    }

    // Broadcast report update to public feed listeners
    broadcast('report:updated', {
      reportId: report._id,
      trackingId: report.trackingId,
      status,
    });

    res.json({
      message: `Report status updated to '${status}'`,
      report,
    });
  } catch (error) {
    console.error('UpdateReportStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/reports/:id/assign
 * @desc    Assign report to department/user (admin)
 * @access  Private (admin)
 */
export const assignReport = async (req, res) => {
  try {
    const { assignedDepartment, assignedTo } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (assignedDepartment) report.assignedDepartment = assignedDepartment;
    if (assignedTo) report.assignedTo = assignedTo;

    if (report.status === 'reported') {
      report.status = 'assigned';
      report.statusHistory.push({
        status: 'assigned',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Assigned to ${assignedDepartment || 'staff'}`,
      });
    }

    await report.save();

    // ─── Notify department about new assignment ────────
    if (assignedDepartment) {
      emitToDepartment(assignedDepartment, 'report:assigned', {
        reportId: report._id,
        trackingId: report.trackingId,
        title: report.title,
        category: report.category,
        priority: report.priority,
      });
    }

    // Notify reporter if they exist
    if (report.reporter) {
      const notification = await Notification.createNotification({
        recipient: report.reporter,
        type: 'report_assigned',
        title: 'Report assigned to department',
        message: `Your report "${report.title}" (${report.trackingId}) has been assigned to the ${assignedDepartment || 'appropriate'} department.`,
        relatedReport: report._id,
        trackingId: report.trackingId,
        metadata: {
          department: assignedDepartment,
          actionBy: req.user._id,
        },
      });

      emitToUser(report.reporter.toString(), 'notification:new', notification);
    }

    res.json({
      message: 'Report assigned successfully',
      report,
    });
  } catch (error) {
    console.error('AssignReport error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/reports/:id/upvote
 * @desc    Upvote a report (citizen)
 * @access  Private
 */
export const upvoteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if already upvoted
    const alreadyUpvoted = report.upvotedBy.includes(req.user._id);

    if (alreadyUpvoted) {
      // Remove upvote
      report.upvotedBy = report.upvotedBy.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      // Add upvote
      report.upvotedBy.push(req.user._id);
      report.upvotes += 1;
    }

    await report.save();

    // Notify reporter about upvote (only on new upvotes, not self-upvotes)
    if (!alreadyUpvoted && report.reporter && report.reporter.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.createNotification({
          recipient: report.reporter,
          type: 'report_upvoted',
          title: 'Your report received an upvote',
          message: `Someone upvoted your report "${report.title}" (${report.trackingId}). Total: ${report.upvotes} upvotes.`,
          relatedReport: report._id,
          trackingId: report.trackingId,
          metadata: { actionBy: req.user._id },
        });
        emitToUser(report.reporter.toString(), 'notification:new', notification);
      } catch (notifErr) {
        console.error('Upvote notification error:', notifErr);
      }
    }

    res.json({
      message: alreadyUpvoted ? 'Upvote removed' : 'Report upvoted',
      upvotes: report.upvotes,
      hasUpvoted: !alreadyUpvoted,
    });
  } catch (error) {
    console.error('UpvoteReport error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/reports/stats/overview
 * @desc    Get report statistics (admin dashboard)
 * @access  Private (admin)
 */
export const getReportStats = async (req, res) => {
  try {
    const [statusStats, categoryStats, priorityStats, totalReports] = await Promise.all([
      Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Report.countDocuments(),
    ]);

    res.json({
      totalReports,
      byStatus: statusStats,
      byCategory: categoryStats,
      byPriority: priorityStats,
    });
  } catch (error) {
    console.error('GetReportStats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/reports/:id/analyze
 * @desc    Re-run AI analysis on an existing report (admin only)
 * @access  Private (admin)
 */
export const reanalyzeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const aiResult = await analyzeReport(report.title, report.description, report.category);

    // Apply AI results
    report.aiTags = aiResult.tags;
    report.aiConfidence = aiResult.confidence;
    report.priority = aiResult.priority;
    report.severity = aiResult.severity;
    report.isDuplicate = aiResult.duplicate.isDuplicate;
    report.duplicateOf = aiResult.duplicate.duplicateOf;
    report.spamScore = aiResult.spam.score;
    report.aiDepartmentSuggestion = {
      department: aiResult.department,
      overridden: aiResult.departmentOverridden,
    };
    report.estimatedResolutionTime = aiResult.estimatedResolution;

    // Optionally update department if AI overrode it
    if (aiResult.departmentOverridden) {
      report.assignedDepartment = aiResult.department;
    }

    await report.save();

    res.json({
      message: 'AI analysis complete',
      report,
      aiInsights: {
        tags: aiResult.tags,
        priority: aiResult.priority,
        severity: aiResult.severity,
        confidence: aiResult.confidence,
        departmentOverridden: aiResult.departmentOverridden,
        suggestedDepartment: aiResult.department,
        duplicate: aiResult.duplicate.isDuplicate ? aiResult.duplicate.match : null,
        spam: aiResult.spam,
        estimatedResolution: aiResult.estimatedResolution,
      },
    });
  } catch (error) {
    console.error('ReanalyzeReport error:', error);
    res.status(500).json({ message: 'Server error during AI analysis' });
  }
};

/**
 * @route   GET /api/reports/map
 * @desc    returns geo-optimized report data
 * @access  Public
 */
export const getMapReports = async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const filter = { 'location.coordinates.lat': { $ne: null } };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const reports = await Report.find(filter)
      .select('trackingId title category status priority location.coordinates location.address createdAt upvotes')
      .lean();
    res.json({ reports });
  } catch (error) {
    console.error('GetMapReports error:', error);
    res.status(500).json({ message: 'Server error retrieving map data' });
  }
};

/**
 * @route   GET /api/reports/analytics
 * @desc    Get analytics data — trends, response times, breakdowns
 * @access  Private (admin)
 */
export const getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ─── 1. Daily trend (reports created per day, last 30 days) ───
    const dailyTrend = await Report.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ─── 2. Avg resolution time by category (hours) ──────────────
    const avgResolutionByCategory = await Report.aggregate([
      {
        $match: {
          status: 'resolved',
          'resolution.resolvedAt': { $ne: null },
        },
      },
      {
        $project: {
          category: 1,
          resolutionHours: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              3600000,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$category',
          avgHours: { $avg: '$resolutionHours' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgHours: 1 } },
    ]);

    // ─── 3. Avg resolution time by priority ──────────────────────
    const avgResolutionByPriority = await Report.aggregate([
      {
        $match: {
          status: 'resolved',
          'resolution.resolvedAt': { $ne: null },
        },
      },
      {
        $project: {
          priority: 1,
          resolutionHours: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              3600000,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$priority',
          avgHours: { $avg: '$resolutionHours' },
          count: { $sum: 1 },
        },
      },
    ]);

    // ─── 4. Resolution rate ──────────────────────────────────────
    const [totalReports, resolvedReports] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'resolved' }),
    ]);
    const resolutionRate = totalReports > 0 ? parseFloat(((resolvedReports / totalReports) * 100).toFixed(1)) : 0;

    // ─── 5. Status / Category / Priority breakdowns ──────────────
    const [byStatus, byCategory, byPriority] = await Promise.all([
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    // ─── 6. Hourly distribution ──────────────────────────────────
    const hourlyDistribution = await Report.aggregate([
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ─── 7. Top areas by report volume ───────────────────────────
    const topAreas = await Report.aggregate([
      { $match: { 'location.address': { $ne: null } } },
      {
        $group: {
          _id: '$location.address',
          count: { $sum: 1 },
          categories: { $addToSet: '$category' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // ─── 8. Monthly comparison (this month vs last month) ────────
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const [thisMonthCount, lastMonthCount] = await Promise.all([
      Report.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Report.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
    ]);

    res.json({
      dailyTrend,
      avgResolutionByCategory,
      avgResolutionByPriority,
      resolutionRate,
      totalReports,
      resolvedReports,
      byStatus,
      byCategory,
      byPriority,
      hourlyDistribution,
      topAreas,
      monthlyComparison: {
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        change: lastMonthCount > 0
          ? parseFloat((((thisMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(1))
          : 0,
      },
    });
  } catch (error) {
    console.error('GetAnalytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

/**
 * @route   GET /api/reports/predictions
 * @desc    Predictive hotspot forecasting — identifies recurring problem areas
 * @access  Private (admin)
 */
export const getPredictions = async (req, res) => {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // ─── 1. Hotspot clusters: areas with 3+ reports in last 60 days ─
    const hotspots = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: sixtyDaysAgo },
          'location.coordinates.lat': { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            // Round coordinates to ~500m grid for clustering
            lat: { $round: [{ $multiply: ['$location.coordinates.lat', 100] }, 0] },
            lng: { $round: [{ $multiply: ['$location.coordinates.lng', 100] }, 0] },
          },
          count: { $sum: 1 },
          avgLat: { $avg: '$location.coordinates.lat' },
          avgLng: { $avg: '$location.coordinates.lng' },
          categories: { $push: '$category' },
          statuses: { $push: '$status' },
          addresses: { $addToSet: '$location.address' },
          latestReport: { $max: '$createdAt' },
          priorities: { $push: '$priority' },
        },
      },
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // Process hotspots for response
    const processedHotspots = hotspots.map((h) => {
      // Determine dominant category
      const catCounts = {};
      h.categories.forEach((c) => { catCounts[c] = (catCounts[c] || 0) + 1; });
      const dominantCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

      // Determine dominant priority
      const priCounts = {};
      h.priorities.forEach((p) => { priCounts[p] = (priCounts[p] || 0) + 1; });
      const dominantPriority = Object.entries(priCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';

      // Calculate unresolved ratio
      const unresolvedCount = h.statuses.filter((s) => !['resolved', 'closed'].includes(s)).length;
      const unresolvedRatio = h.count > 0 ? unresolvedCount / h.count : 0;

      // Confidence score: based on report density and recency
      const daysSinceLatest = (Date.now() - new Date(h.latestReport).getTime()) / 86400000;
      const recencyFactor = Math.max(0, 1 - daysSinceLatest / 60);
      const densityFactor = Math.min(h.count / 10, 1);
      const confidence = parseFloat(((recencyFactor * 0.4 + densityFactor * 0.4 + unresolvedRatio * 0.2) * 100).toFixed(0));

      return {
        coordinates: { lat: h.avgLat, lng: h.avgLng },
        reportCount: h.count,
        dominantCategory,
        dominantPriority,
        unresolvedCount,
        address: h.addresses[0] || 'Unknown area',
        confidence: Math.min(confidence, 95),
        lastReported: h.latestReport,
        riskLevel: confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low',
      };
    });

    // ─── 2. Day-of-week trend ─────────────────────────────────────
    const dayOfWeekTrend = await Report.aggregate([
      { $match: { createdAt: { $gte: sixtyDaysAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' }, // 1=Sun, 7=Sat
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayTrend = dayOfWeekTrend.map((d) => ({
      day: dayNames[d._id - 1],
      dayIndex: d._id,
      count: d.count,
    }));

    // ─── 3. Category trend (last 4 weeks vs previous 4 weeks) ─────
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const [recentCatCounts, olderCatCounts] = await Promise.all([
      Report.aggregate([
        { $match: { createdAt: { $gte: fourWeeksAgo } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: eightWeeksAgo, $lt: fourWeeksAgo } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const recentMap = {};
    recentCatCounts.forEach((c) => { recentMap[c._id] = c.count; });
    const olderMap = {};
    olderCatCounts.forEach((c) => { olderMap[c._id] = c.count; });

    const categories = ['roads', 'sanitation', 'water', 'electricity', 'parks', 'traffic', 'other'];
    const categoryTrends = categories.map((cat) => {
      const recent = recentMap[cat] || 0;
      const older = olderMap[cat] || 0;
      const change = older > 0 ? parseFloat((((recent - older) / older) * 100).toFixed(1)) : (recent > 0 ? 100 : 0);
      return { category: cat, recentCount: recent, previousCount: older, changePercent: change, trending: change > 10 ? 'up' : change < -10 ? 'down' : 'stable' };
    });

    res.json({
      hotspots: processedHotspots,
      dayOfWeekTrend: dayTrend,
      categoryTrends,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GetPredictions error:', error);
    res.status(500).json({ message: 'Server error generating predictions' });
  }
};
