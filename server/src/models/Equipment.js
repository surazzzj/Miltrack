const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Equipment type is required'],
      enum: ['VEHICLE', 'WEAPON', 'AMMUNITION', 'COMMUNICATION', 'PROTECTIVE', 'OTHER'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Equipment code / NSN is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isSerialized: {
      type: Boolean,
      default: false,
    },
    unitOfMeasure: {
      type: String,
      default: 'units',
      trim: true,
    },
    standardCost: {
      type: Number,
      default: 0,
      min: 0,
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

const Equipment = mongoose.model('Equipment', equipmentSchema);
module.exports = Equipment;
