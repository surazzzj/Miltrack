const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
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
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative'],
    },
    supplier: {
      type: String,
      required: [true, 'Supplier is required'],
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save safety hook to enforce totalCost = quantity * unitCost
purchaseSchema.pre('save', function (next) {
  if (this.quantity && this.unitCost !== undefined) {
    this.totalCost = Math.round(this.quantity * this.unitCost * 100) / 100;
  }
  next();
});

const Purchase = mongoose.model('Purchase', purchaseSchema);
module.exports = Purchase;
