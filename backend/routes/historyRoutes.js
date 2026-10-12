const express = require('express');
const router = express.Router();
const {
  getTestHistory,
  getComparisonSummary,
  getTrackedBiomarkers,
} = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/trend/:testName', getTestHistory);
router.get('/comparison', getComparisonSummary);
router.get('/biomarkers', getTrackedBiomarkers);

module.exports = router;
