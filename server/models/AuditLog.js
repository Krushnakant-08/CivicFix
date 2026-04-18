import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * AuditLog — Phase 8.2 (Blockchain Audit Trail Simulation)
 * 
 * Each log entry contains a SHA-256 hash of its own data,
 * chained to the previous entry's hash — creating an immutable
 * audit trail that detects any tampering.
 */
const auditLogSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'REPORT_CREATED',
        'REPORT_UPDATED',
        'STATUS_CHANGED',
        'REPORT_ASSIGNED',
        'REPORT_UPVOTED',
        'REPORT_ANALYZED',
        'REPORT_REANALYZED',
        'COMMENT_ADDED',
        'USER_REGISTERED',
        'USER_LOGIN',
        'ADMIN_ACTION',
      ],
    },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String, default: 'anonymous' },
      role: { type: String, enum: ['citizen', 'department', 'admin', 'system'], default: 'system' },
      ip: { type: String },
    },
    metadata: {
      // Flexible payload: e.g., { oldStatus: 'pending', newStatus: 'resolved' }
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // ─── Blockchain hash chain ───────────────────────────────
    hash: {
      type: String,
      required: true,
    },
    previousHash: {
      type: String,
      required: true,
      default: '0000000000000000000000000000000000000000000000000000000000000000',
    },
    blockIndex: {
      type: Number,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // We manage timestamp manually for hash integrity
    versionKey: false,
  }
);

/**
 * Compute SHA-256 hash for a log entry.
 * The hash covers: blockIndex + reportId + action + actor + metadata + timestamp + previousHash
 */
auditLogSchema.statics.computeHash = function (data) {
  const payload = JSON.stringify({
    blockIndex: data.blockIndex,
    reportId: data.reportId?.toString(),
    action: data.action,
    actor: data.actor,
    metadata: data.metadata,
    timestamp: data.timestamp,
    previousHash: data.previousHash,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Create and save a new audit log entry with proper hash chaining.
 */
auditLogSchema.statics.createEntry = async function ({
  reportId,
  action,
  actor = {},
  metadata = {},
}) {
  // Get the last block to chain hashes
  const lastBlock = await this.findOne().sort({ blockIndex: -1 }).select('hash blockIndex');
  const blockIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;
  const previousHash = lastBlock
    ? lastBlock.hash
    : '0000000000000000000000000000000000000000000000000000000000000000';

  const timestamp = new Date();

  // Compute hash before saving
  const hash = this.computeHash({
    blockIndex,
    reportId,
    action,
    actor,
    metadata,
    timestamp,
    previousHash,
  });

  return this.create({
    reportId,
    action,
    actor,
    metadata,
    timestamp,
    hash,
    previousHash,
    blockIndex,
  });
};

/**
 * Verify the integrity of the entire audit chain.
 * Returns { valid: bool, brokenAt: blockIndex | null }
 */
auditLogSchema.statics.verifyChain = async function () {
  const blocks = await this.find().sort({ blockIndex: 1 });
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const expectedPrev = i === 0
      ? '0000000000000000000000000000000000000000000000000000000000000000'
      : blocks[i - 1].hash;

    if (block.previousHash !== expectedPrev) {
      return { valid: false, brokenAt: block.blockIndex };
    }

    const expectedHash = this.computeHash({
      blockIndex: block.blockIndex,
      reportId: block.reportId,
      action: block.action,
      actor: block.actor,
      metadata: block.metadata,
      timestamp: block.timestamp,
      previousHash: block.previousHash,
    });

    if (block.hash !== expectedHash) {
      return { valid: false, brokenAt: block.blockIndex };
    }
  }
  return { valid: true, brokenAt: null };
};

export default mongoose.model('AuditLog', auditLogSchema);
