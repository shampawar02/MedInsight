const fs = require('fs');
const path = require('path');
const MedicalReport = require('../models/MedicalReport');
const MedicalTest = require('../models/MedicalTest');
const Analysis = require('../models/Analysis');
const aiService = require('../services/aiService');

// @desc    Upload a new medical report and trigger full AI processing
// @route   POST /api/reports/upload
// @access  Private
const uploadReport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please upload a supported PDF, JPG or PNG file.',
    });
  }

  const { originalname, filename, path: filePath, size } = req.file;
  const ext = path.extname(originalname).toLowerCase().replace('.', '');

  let report = null;

  try {
    // 1. Create Report in DB with PENDING / PROCESSING status
    report = await MedicalReport.create({
      userId: req.user._id,
      fileName: filename,
      originalName: originalname,
      filePath: filePath,
      fileType: ext,
      fileSize: size,
      status: 'PROCESSING',
    });

    // 2. Delegate extraction & AI analysis to Python FastAPI service
    const aiResult = await aiService.processDocument(filePath, report._id);

    if (!aiResult.success) {
      report.status = 'FAILED';
      report.processingError = aiResult.error || 'AI analysis failed';
      await report.save();

      return res.status(422).json({
        success: false,
        message: 'Could not extract readable text or medical parameters from this document.',
        report,
      });
    }

    // 3. Update report with extracted text and date
    report.extractedText = aiResult.extracted_text || '';
    if (aiResult.report_date) {
      const parsedDate = new Date(aiResult.report_date);
      if (!isNaN(parsedDate.getTime())) {
        report.reportDate = parsedDate;
      }
    }
    report.status = 'PROCESSED';
    await report.save();

    // 4. Save extracted medical tests into MedicalTest collection
    const testDocs = [];
    if (Array.isArray(aiResult.tests)) {
      for (const t of aiResult.tests) {
        testDocs.push({
          reportId: report._id,
          userId: req.user._id,
          testName: t.test_name,
          normalizedName: t.normalized_name || t.test_name.toLowerCase(),
          value: t.value,
          unit: t.unit || '',
          referenceRange: {
            low: t.reference_range?.low ?? null,
            high: t.reference_range?.high ?? null,
            raw: t.reference_range?.raw || '',
          },
          status: t.status || 'NORMAL',
          category: t.category || 'General',
        });
      }
    }

    if (testDocs.length > 0) {
      await MedicalTest.insertMany(testDocs);
    }

    // 5. Save Analysis summary, abnormalities, ML risk prediction & SHAP
    const riskPred = aiResult.risk_prediction || { available: false };
    const analysis = await Analysis.create({
      reportId: report._id,
      userId: req.user._id,
      summary: aiResult.summary || 'Summary generated from uploaded report.',
      abnormalities: (aiResult.abnormalities || []).map((a) => ({
        testName: a.test_name,
        value: a.value,
        unit: a.unit,
        referenceRange: a.reference_range,
        status: a.status,
        clinicalSignificance: a.clinical_significance,
      })),
      riskPrediction: {
        available: Boolean(riskPred.available),
        condition: riskPred.condition || 'Metabolic & Diabetes Screening Risk',
        riskScore: riskPred.risk_score ?? null,
        riskLevel: riskPred.risk_level ?? null,
        modelName: riskPred.model_name || 'Scikit-Learn Clinical Screening Classifier',
        featuresUsed: riskPred.features_used || [],
        message: riskPred.message || '',
      },
      shapValues: (riskPred.shap_values || []).map((s) => ({
        feature: s.feature,
        value: s.value,
        impact: s.impact,
      })),
    });

    res.status(201).json({
      success: true,
      message: 'Medical report processed successfully.',
      report,
      tests: testDocs,
      analysis,
    });
  } catch (error) {
    console.error('[Upload Report Processing Error]:', error);

    if (report) {
      report.status = 'FAILED';
      report.processingError = error.message;
      await report.save();
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while processing report.',
    });
  }
};

// @desc    Get all reports for the current user
// @route   GET /api/reports
// @access  Private
const getUserReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ userId: req.user._id })
      .select('-extractedText -filePath')
      .sort({ createdAt: -1 });

    // Count statistics for the dashboard
    const totalReports = reports.length;
    const abnormalCount = await MedicalTest.countDocuments({
      userId: req.user._id,
      status: { $in: ['HIGH', 'LOW', 'CRITICAL'] },
    });

    res.json({
      success: true,
      count: totalReports,
      stats: {
        totalReports,
        abnormalCount,
        latestReport: reports[0] || null,
      },
      reports,
    });
  } catch (error) {
    console.error('[Get Reports Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports.',
    });
  }
};

// @desc    Get single report by ID with tests and analysis
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const report = await MedicalReport.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found or unauthorized.',
      });
    }

    const tests = await MedicalTest.find({
      reportId: report._id,
      userId: req.user._id,
    }).sort({ category: 1, testName: 1 });

    const analysis = await Analysis.findOne({
      reportId: report._id,
      userId: req.user._id,
    });

    res.json({
      success: true,
      report,
      tests,
      analysis,
    });
  } catch (error) {
    console.error('[Get Report By Id Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report details.',
    });
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const report = await MedicalReport.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or unauthorized.',
      });
    }

    await aiService.deleteReportIndex(report._id);

    // Delete associated tests and analysis
    await MedicalTest.deleteMany({ reportId: report._id });
    await Analysis.deleteOne({ reportId: report._id });

    // Delete physical file
    if (fs.existsSync(report.filePath)) {
      try {
        fs.unlinkSync(report.filePath);
      } catch (err) {
        console.warn('Could not remove report file from disk:', err.message);
      }
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Medical report and associated records deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Report Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report.',
    });
  }
};

// @desc    Download original report file
// @route   GET /api/reports/:id/download
// @access  Private
const downloadReport = async (req, res) => {
  try {
    const report = await MedicalReport.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report || !report.filePath || !fs.existsSync(report.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found on server.',
      });
    }

    res.download(report.filePath, report.originalName || `report_${report._id}.${report.fileType || 'pdf'}`);
  } catch (error) {
    console.error('[Download Report Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report file.',
    });
  }
};

module.exports = {
  uploadReport,
  getUserReports,
  getReportById,
  deleteReport,
  downloadReport,
};
