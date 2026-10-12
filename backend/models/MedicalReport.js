const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'png', 'jpg', 'jpeg'],
      default: 'pdf',
    },
    fileSize: {
      type: Number,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    extractedText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
    },
    processingError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
