const mongoose = require('mongoose');

const medicalTestSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalReport',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      trim: true,
      lowercase: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    referenceRange: {
      low: { type: Number, default: null },
      high: { type: Number, default: null },
      raw: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'LOW', 'CRITICAL'],
      default: 'NORMAL',
    },
    category: {
      type: String,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast historical queries by user and test name
medicalTestSchema.index({ userId: 1, normalizedName: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalTest', medicalTestSchema);
