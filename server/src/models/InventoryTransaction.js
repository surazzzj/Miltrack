const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: ['PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'EXPENDITURE', 'ADJUSTMENT'],
      required: [true, 'Transaction type is required'],
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
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    direction: {
      type: String,
      enum: ['IN', 'OUT'],
      required: [true, 'Direction is required'],
      index: true,
    },
    referenceType: {
      type: String,
      enum: ['Purchase', 'Transfer', 'Expenditure', 'Adjustment'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast historical balance rollups
inventoryTransactionSchema.index({ baseId: 1, equipmentId: 1, transactionDate: 1 });
inventoryTransactionSchema.index({ baseId: 1, transactionDate: 1, transactionType: 1 });

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
module.exports = InventoryTransaction;
