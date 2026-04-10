import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // ─── Recipient ──────────────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ─── Content ────────────────────────────────────────
    type: {
      type: String,
      enum: [
        'status_change',      // Report status was updated
        'report_assigned',     // Report assigned to department
        'report_upvoted',      // Someone upvoted your report
        'new_report',          // New report in your department (for dept users)
        'report_resolved',     // Your report was resolved
        'system',              // System-wide announcement
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // ─── Related Entity ─────────────────────────────────
    relatedReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
    },

    trackingId: {
      type: String,
      default: null,
    },

    // ─── State ──────────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ─── Metadata ───────────────────────────────────────
    metadata: {
      oldStatus: String,
      newStatus: String,
      category: String,
      department: String,
      actionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// ─── Static: Create notification helper ────────────────
notificationSchema.statics.createNotification = async function ({
  recipient,
  type,
  title,
  message,
  relatedReport = null,
  trackingId = null,
  metadata = {},
}) {
  return this.create({
    recipient,
    type,
    title,
    message,
    relatedReport,
    trackingId,
    metadata,
  });
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
