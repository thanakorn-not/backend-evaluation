const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN'));

router.route('/evaluations')
    .post(adminController.createEvaluation)
    .get(adminController.getEvaluations);

router.route('/evaluations/:id')
    .get(adminController.getEvaluationDetails)
    .patch(adminController.updateEvaluation)
    .delete(adminController.deleteEvaluation);

router.post('/evaluations/:id/topics', adminController.createTopic);
router.post('/topics/:id/indicators', adminController.createIndicator);

router.route('/topics/:id')
    .patch(adminController.updateTopic)
    .delete(adminController.deleteTopic);

router.route('/indicators/:id')
    .patch(adminController.updateIndicator)
    .delete(adminController.deleteIndicator);

router.route('/assignments/:id')
    .delete(adminController.deleteAssignment);

router.post('/assignments', adminController.createAssignment);

router.get('/users', adminController.getUsersByRole);
router.get('/stats', adminController.getStats);

module.exports = router;
