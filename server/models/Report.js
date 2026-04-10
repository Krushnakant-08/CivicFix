import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    // Tracking
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },

    // Reporter Info
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for anonymous reports
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // Issue Details
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'roads',        // Potholes, road damage
        'sanitation',   // Garbage, overflowing bins
        'water',        // Water leaks, supply issues
        'electricity',  // Streetlights, power outage
        'parks',        // Park maintenance
        'traffic',      // Traffic signals, signs
        'other',        // Miscellaneous
      ],
    },

    // Location
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
      },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
      ward: {
        type: String,
        default: null,
      },
    },

    // Media
    images: [
      {
        url: { type: String },
        publicId: { type: String }, // For cloud storage reference
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    voiceNote: {
      url: { type: String, default: null },
      duration: { type: Number, default: null }, // seconds
    },

    // Status & Workflow
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'reported',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    // Department Assignment
    assignedDepartment: {
      type: String,
      enum: ['roads', 'sanitation', 'water', 'electricity', 'parks', 'traffic', 'general', null],
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Resolution
    resolution: {
      description: { type: String, default: null },
      images: [{ url: String, uploadedAt: { type: Date, default: Date.now } }],
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      resolvedAt: { type: Date, default: null },
    },

    // Timestamps for status transitions
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: null },
      },
    ],

    // Engagement
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // AI Metadata (Phase 5)
    aiTags: [String],
    aiConfidence: { type: Number, default: null },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null },
    spamScore: { type: Number, default: 0 },
    aiDepartmentSuggestion: {
      department: { type: String, default: null },
      overridden: { type: Boolean, default: false },
    },

    // Estimated Resolution
    estimatedResolutionTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Indexes for performance
reportSchema.index({ trackingId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ assignedDepartment: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ priority: 1, severity: -1 });

// Static: Generate unique tracking ID
reportSchema.statics.generateTrackingId = async function () {
  const prefix = 'CF';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const trackingId = `${prefix}-${date}-${random}`;

  // Ensure uniqueness
  const exists = await this.findOne({ trackingId });
  if (exists) return this.generateTrackingId();
  return trackingId;
};

const Report = mongoose.model('Report', reportSchema);
export default Report;
