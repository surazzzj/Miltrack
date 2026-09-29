const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    fromBaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Base',
      required: [true, 'Origin base is required'],
      index: true,
    },
    toBaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Base',
      required: [true, 'Destination base is required'],
      index: true,
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment is required'],
      index: true,
    },
    assetDescription: {
      type: String,
      trim: true,
    },
    assetCode: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Transfer quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    transferDate: {
      type: Date,
      required: [true, 'Transfer date is required'],
      default: Date.now,
      index: true,
    },
    expectedArrival: {
      type: Date,
    },
    reason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    inventoryApplied: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Transfer = mongoose.model('Transfer', transferSchema);
module.exports = Transfer;
