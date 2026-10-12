const express = require('express');
const router = express.Router();
const {
  getReportAnalysis,
  chatWithReport,
  explainMedicalTerm,
} = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:id/analysis', getReportAnalysis);
router.post('/:id/chat', chatWithReport);
router.post('/explain-term', explainMedicalTerm);

module.exports = router;
