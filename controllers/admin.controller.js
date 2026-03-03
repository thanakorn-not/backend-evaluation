const prisma = require('../utils/db');
const AppError = require('../utils/AppError');

// Evaluations
exports.createEvaluation = async (req, res, next) => {
    try {
        const evaluation = await prisma.evaluation.create({
            data: req.body
        });
        res.status(201).json({ status: 'success', data: { evaluation } });
    } catch (err) { next(err); }
};

exports.getEvaluations = async (req, res, next) => {
    try {
        const evaluations = await prisma.evaluation.findMany({
            include: {
                topics: {
                    include: { indicators: true }
                },
                assignments: true
            }
        });
        res.status(200).json({ status: 'success', data: { evaluations } });
    } catch (err) { next(err); }
};

exports.updateEvaluation = async (req, res, next) => {
    try {
        const evaluation = await prisma.evaluation.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.status(200).json({ status: 'success', data: { evaluation } });
    } catch (err) { next(err); }
};

exports.deleteEvaluation = async (req, res, next) => {
    try {
        await prisma.evaluation.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) { next(err); }
};

exports.getEvaluationDetails = async (req, res, next) => {
    try {
        const evaluation = await prisma.evaluation.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                topics: {
                    include: { indicators: true }
                },
                assignments: {
                    include: {
                        evaluator: { select: { id: true, name: true, email: true } },
                        evaluatee: { select: { id: true, name: true, email: true } },
                        results: true
                    }
                }
            }
        });

        if (!evaluation) {
            return next(new AppError('Evaluation not found', 404));
        }

        res.status(200).json({ status: 'success', data: { evaluation } });
    } catch (err) { next(err); }
};

exports.getUsersByRole = async (req, res, next) => {
    try {
        const { role } = req.query;
        let where = {};
        if (role) where.role = role;

        const users = await prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true, role: true }
        });

        res.status(200).json({ status: 'success', data: { users } });
    } catch (err) { next(err); }
};

// Topics
exports.createTopic = async (req, res, next) => {
    try {
        const topic = await prisma.topic.create({
            data: {
                name: req.body.name,
                evaluationId: parseInt(req.params.id)
            }
        });
        res.status(201).json({ status: 'success', data: { topic } });
    } catch (err) { next(err); }
};

exports.updateTopic = async (req, res, next) => {
    try {
        const topic = await prisma.topic.update({
            where: { id: parseInt(req.params.id) },
            data: { name: req.body.name }
        });
        res.status(200).json({ status: 'success', data: { topic } });
    } catch (err) { next(err); }
};

exports.deleteTopic = async (req, res, next) => {
    try {
        await prisma.topic.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) { next(err); }
};

// Indicators Logic (Weight validation)
const checkWeightLimit = async (evaluationId, addingVal = 0, ignoreIndicatorId = null) => {
    const topics = await prisma.topic.findMany({
        where: { evaluationId },
        include: { indicators: true }
    });

    let totalWeight = 0;
    for (const t of topics) {
        for (const ind of t.indicators) {
            if (!ignoreIndicatorId || ind.id !== ignoreIndicatorId) {
                totalWeight += ind.weight;
            }
        }
    }

    if (totalWeight + addingVal > 100) {
        throw new AppError(`Total weight will exceed 100%. Current: ${totalWeight}%, Adding: ${addingVal}%`, 400);
    }
};

exports.createIndicator = async (req, res, next) => {
    try {
        const topicId = parseInt(req.params.id);
        const topic = await prisma.topic.findUnique({ where: { id: topicId } });
        if (!topic) return next(new AppError('Topic not found', 404));

        await checkWeightLimit(topic.evaluationId, req.body.weight);

        const indicator = await prisma.indicator.create({
            data: {
                ...req.body,
                topicId
            }
        });
        res.status(201).json({ status: 'success', data: { indicator } });
    } catch (err) { next(err); }
};

exports.updateIndicator = async (req, res, next) => {
    try {
        const indicatorId = parseInt(req.params.id);
        const existing = await prisma.indicator.findUnique({
            where: { id: indicatorId },
            include: { topic: true }
        });
        if (!existing) return next(new AppError('Indicator not found', 404));

        if (req.body.weight) {
            await checkWeightLimit(existing.topic.evaluationId, req.body.weight, indicatorId);
        }

        const indicator = await prisma.indicator.update({
            where: { id: indicatorId },
            data: req.body
        });
        res.status(200).json({ status: 'success', data: { indicator } });
    } catch (err) { next(err); }
};

exports.deleteIndicator = async (req, res, next) => {
    try {
        await prisma.indicator.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) { next(err); }
};

// Assignments
exports.createAssignment = async (req, res, next) => {
    try {
        const { evaluationId, evaluatorId, evaluateeId } = req.body;

        if (evaluatorId === evaluateeId) {
            return next(new AppError('evaluatorId cannot be same as evaluateeId', 400));
        }

        // Check duplicate
        const existing = await prisma.assignment.findUnique({
            where: {
                evaluationId_evaluatorId_evaluateeId: {
                    evaluationId, evaluatorId, evaluateeId
                }
            }
        });

        if (existing) {
            return next(new AppError('DUPLICATE_ASSIGNMENT', 409));
        }

        const assignment = await prisma.assignment.create({
            data: { evaluationId, evaluatorId, evaluateeId }
        });

        res.status(201).json({ status: 'success', data: { assignment } });
    } catch (err) {
        if (err.code === 'P2002') {
            return next(new AppError('DUPLICATE_ASSIGNMENT', 409));
        }
        next(err);
    }
};

exports.deleteAssignment = async (req, res, next) => {
    try {
        await prisma.assignment.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
    try {
        const [totalEvaluations, totalEvaluators, totalEvaluatees] = await Promise.all([
            prisma.evaluation.count(),
            prisma.user.count({ where: { role: 'EVALUATOR' } }),
            prisma.user.count({ where: { role: 'EVALUATEE' } })
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                totalEvaluations,
                totalEvaluators,
                totalEvaluatees
            }
        });
    } catch (err) { next(err); }
};
