import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import { emitToUser, emitToDepartment, broadcast } from '../socket.js';

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

    // Auto-assign department based on category
    const assignedDepartment = CATEGORY_TO_DEPARTMENT[category] || 'general';

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
      statusHistory: [
        {
          status: 'reported',
          changedBy: req.user?._id || null,
          changedAt: new Date(),
          note: 'Report submitted',
        },
      ],
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
      trackingId: report.trackingId,
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
