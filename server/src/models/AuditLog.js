const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    userName: {
      type: String,
      default: 'System',
    },
    role: {
      type: String,
      default: 'SYSTEM',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    baseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Base',
      default: null,
      index: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Terminal',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ baseId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
