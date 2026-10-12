const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalReport',
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    summary: {
      type: String,
      default: '',
    },
    abnormalities: [
      {
        testName: String,
        value: Number,
        unit: String,
        referenceRange: String,
        status: String,
        clinicalSignificance: String,
      },
    ],
    riskPrediction: {
      available: { type: Boolean, default: false },
      condition: { type: String, default: 'Metabolic & Cardiometabolic Risk' },
      riskScore: { type: Number, default: null }, // Probability percentage 0-100
      riskLevel: { type: String, default: null }, // 'Low', 'Moderate', 'Elevated'
      modelName: { type: String, default: 'Scikit-Learn Clinical Screening Classifier' },
      featuresUsed: [String],
      message: { type: String, default: '' },
    },
    shapValues: [
      {
        feature: String,
        value: Number,
        impact: Number, // positive pushes higher risk, negative pushes lower
      },
    ],
    disclaimer: {
      type: String,
      default:
        'MedInsight AI provides educational and decision-support screening based on uploaded data. It is not a medical diagnosis or substitute for professional medical care.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Analysis', analysisSchema);
