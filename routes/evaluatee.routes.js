const express = require('express');
const evaluateeController = require('../controllers/evaluatee.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect, restrictTo('EVALUATEE'));

router.get('/evaluations', evaluateeController.getEvaluations);
router.get('/evaluations/:id', evaluateeController.getEvaluationDetails);

router.post(
    '/evaluations/:evaluationId/evidence',
    upload.single('evidence'),
    evaluateeController.uploadEvidence
);

module.exports = router;
