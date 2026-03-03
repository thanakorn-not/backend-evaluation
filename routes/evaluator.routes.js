const express = require('express');
const evaluatorController = require('../controllers/evaluator.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('EVALUATOR'));

router.get('/evaluations', evaluatorController.getEvaluations);
router.get('/evaluations/:evaluationId', evaluatorController.getEvaluationsForEvaluator);
router.get('/assignments/:id', evaluatorController.getAssignmentDetails);
router.post('/assignments/:id/score', evaluatorController.giveScore);

module.exports = router;
