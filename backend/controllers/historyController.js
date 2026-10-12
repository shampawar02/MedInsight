const MedicalReport = require('../models/MedicalReport');
const MedicalTest = require('../models/MedicalTest');

// @desc    Get historical time-series data for a specific biomarker
// @route   GET /api/history/trend/:testName
// @access  Private
const getTestHistory = async (req, res) => {
  try {
    const rawName = req.params.testName;
    if (!rawName) {
      return res.status(400).json({
        success: false,
        message: 'Test name is required.',
      });
    }

    const searchRegex = new RegExp(rawName.trim(), 'i');

    const tests = await MedicalTest.find({
      userId: req.user._id,
      $or: [
        { testName: searchRegex },
        { normalizedName: searchRegex },
      ],
    })
      .populate('reportId', 'reportDate fileName createdAt')
      .sort({ createdAt: 1 });

    const timeSeries = tests.map((t) => {
      const dateVal = t.reportId?.reportDate || t.createdAt;
      return {
        id: t._id,
        reportId: t.reportId?._id,
        testName: t.testName,
        value: t.value,
        unit: t.unit,
        referenceRange: t.referenceRange?.raw || '',
        low: t.referenceRange?.low,
        high: t.referenceRange?.high,
        status: t.status,
        date: new Date(dateVal).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        timestamp: new Date(dateVal).getTime(),
      };
    });

    res.json({
      success: true,
      testName: rawName,
      dataPoints: timeSeries.length,
      history: timeSeries,
    });
  } catch (error) {
    console.error('[Get Test History Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve test history.',
    });
  }
};

// @desc    Get latest vs previous comparison across common biomarkers
// @route   GET /api/history/comparison
// @access  Private
const getComparisonSummary = async (req, res) => {
  try {
    // 1. Get user reports sorted chronologically descending
    const reports = await MedicalReport.find({
      userId: req.user._id,
      status: 'PROCESSED',
    }).sort({ createdAt: -1 });

    if (reports.length < 2) {
      return res.json({
        success: true,
        hasMultipleReports: false,
        message: 'Historical comparison will appear when multiple reports are available.',
        comparisons: [],
      });
    }

    const latestReport = reports[0];
    const previousReport = reports[1];

    const latestTests = await MedicalTest.find({
      reportId: latestReport._id,
      userId: req.user._id,
    });

    const previousTests = await MedicalTest.find({
      reportId: previousReport._id,
      userId: req.user._id,
    });

    const prevMap = new Map();
    previousTests.forEach((t) => {
      const key = (t.normalizedName || t.testName).trim().toLowerCase();
      prevMap.set(key, t);
    });

    const comparisons = [];

    latestTests.forEach((lt) => {
      const key = (lt.normalizedName || lt.testName).trim().toLowerCase();
      const pt = prevMap.get(key);
      if (pt && (pt.unit || '').trim().toLowerCase() === (lt.unit || '').trim().toLowerCase()) {
        let trend = 'Stable';
        const diff = lt.value - pt.value;
        const percentChange = pt.value !== 0 ? (diff / pt.value) * 100 : 0;

        if (Math.abs(percentChange) > 2) {
          trend = diff > 0 ? 'Increased' : 'Decreased';
        }

        comparisons.push({
          testName: lt.testName,
          previousValue: pt.value,
          latestValue: lt.value,
          unit: lt.unit,
          difference: Number(diff.toFixed(2)),
          trend,
          status: lt.status,
          referenceRange: lt.referenceRange?.raw || '',
        });
      }
    });

    res.json({
      success: true,
      hasMultipleReports: true,
      latestReportDate: latestReport.reportDate || latestReport.createdAt,
      previousReportDate: previousReport.reportDate || previousReport.createdAt,
      comparisons,
    });
  } catch (error) {
    console.error('[Get Comparison Summary Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comparison summary.',
    });
  }
};

// @desc    Get list of unique biomarkers tracked for this user
// @route   GET /api/history/biomarkers
// @access  Private
const getTrackedBiomarkers = async (req, res) => {
  try {
    const biomarkers = await MedicalTest.distinct('testName', {
      userId: req.user._id,
    });

    res.json({
      success: true,
      biomarkers,
    });
  } catch (error) {
    console.error('[Get Tracked Biomarkers Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracked biomarkers.',
    });
  }
};

module.exports = {
  getTestHistory,
  getComparisonSummary,
  getTrackedBiomarkers,
};
