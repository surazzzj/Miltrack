const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Don't return by default
    },
    role: {
      type: String,
      enum: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'],
      default: 'LOGISTICS_OFFICER',
      required: true,
      index: true,
    },
    baseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Base',
      default: null,
      index: true,
    },
    rank: {
      type: String,
      default: 'Officer',
      trim: true,
    },
    serviceId: {
      type: String,
      trim: true,
      default: function () {
        return `CAC-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
