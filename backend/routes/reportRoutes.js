const express = require('express');
const router = express.Router();
const {
  uploadReport,
  getUserReports,
  getReportById,
  deleteReport,
  downloadReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All report routes are protected by JWT
router.use(protect);

router.post('/upload', upload.single('file'), uploadReport);
router.get('/', getUserReports);
router.get('/:id', getReportById);
router.get('/:id/download', downloadReport);
router.delete('/:id', deleteReport);

module.exports = router;
