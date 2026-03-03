const express = require('express');
const reportsController = require('../controllers/reports.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/evaluation/:evaluationId/result', reportsController.getEvaluationResult);

module.exports = router;
