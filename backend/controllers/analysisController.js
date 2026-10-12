const MedicalReport = require('../models/MedicalReport');
const MedicalTest = require('../models/MedicalTest');
const Analysis = require('../models/Analysis');
const aiService = require('../services/aiService');

// @desc    Get analysis for a report
// @route   GET /api/reports/:id/analysis
// @access  Private
const getReportAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      reportId: req.params.id,
      userId: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found for this report.',
      });
    }

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[Get Analysis Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report analysis.',
    });
  }
};

// @desc    Chat with AI about a specific report using RAG
// @route   POST /api/reports/:id/chat
// @access  Private
const chatWithReport = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question cannot be empty.',
      });
    }

    // Verify user ownership of report
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

    // Fetch structured tests for this report to ground answers accurately
    const tests = await MedicalTest.find({ reportId: report._id, userId: req.user._id }).lean();

    // Query RAG via Python AI service
    const ragResponse = await aiService.askQuestion(
      report._id,
      question,
      report.extractedText || '',
      tests
    );

    res.json({
      success: true,
      answer: ragResponse.answer,
      sources: ragResponse.sources || [],
      groundedInReport: ragResponse.grounded_in_report ?? true,
    });
  } catch (error) {
    console.error('[Chat With Report Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while querying report AI assistant.',
    });
  }
};

// @desc    Get educational explanation for a specific medical term
// @route   POST /api/reports/explain-term
// @access  Private
const explainMedicalTerm = async (req, res) => {
  try {
    const { testName, value, unit, status } = req.body;

    if (!testName) {
      return res.status(400).json({
        success: false,
        message: 'Test name is required.',
      });
    }

    const explanation = await aiService.explainTerm(testName, value, unit, status);

    res.json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error('[Explain Term Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate term explanation.',
    });
  }
};

module.exports = {
  getReportAnalysis,
  chatWithReport,
  explainMedicalTerm,
};
