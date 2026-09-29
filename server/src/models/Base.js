const mongoose = require('mongoose');

const baseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Base name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Base code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'Tactical Depot',
      trim: true,
    },
    capacity: {
      type: Number,
      default: 25000,
    },
    description: {
      type: String,
      trim: true,
    },
    commanderName: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Base = mongoose.model('Base', baseSchema);
module.exports = Base;
