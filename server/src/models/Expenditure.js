const mongoose = require('mongoose');

const expenditureSchema = new mongoose.Schema(
  {
    expenditureNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Expenditure date is required'],
      default: Date.now,
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
    assetDescription: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for expenditure is required'],
      trim: true,
    },
    personnelName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expenditure = mongoose.model('Expenditure', expenditureSchema);
module.exports = Expenditure;
