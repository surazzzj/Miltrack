const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    assignmentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    baseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Base',
      required: [true, 'Base is required'],
      index: true,
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment is required'],
      index: true,
    },
    assetCode: {
      type: String,
      trim: true,
    },
    personnelName: {
      type: String,
      required: [true, 'Personnel name is required'],
      trim: true,
    },
    personnelId: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    assignmentDate: {
      type: Date,
      required: [true, 'Assignment date is required'],
      default: Date.now,
      index: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RETURNED', 'TRANSFERRED'],
      default: 'ACTIVE',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
