const prisma = require('../utils/db');
const AppError = require('../utils/AppError');

exports.getEvaluations = async (req, res, next) => {
    try {
        const evaluatorId = req.user.id;
        const assignments = await prisma.assignment.findMany({
            where: { evaluatorId },
            include: { evaluation: true }
        });

        const evaluationsMap = new Map();
        assignments.forEach(a => {
            if (!evaluationsMap.has(a.evaluationId)) {
                evaluationsMap.set(a.evaluationId, a.evaluation);
            }
        });

        res.status(200).json({ status: 'success', data: { evaluations: Array.from(evaluationsMap.values()) } });
    } catch (err) { next(err); }
};

exports.getEvaluationsForEvaluator = async (req, res, next) => {
    try {
        const evaluationId = parseInt(req.params.evaluationId);
        const evaluatorId = req.user.id;

        const evaluation = await prisma.evaluation.findUnique({
            where: { id: evaluationId },
            include: {
                topics: {
                    include: { indicators: true }
                }
            }
        });

        if (!evaluation) {
            return next(new AppError('Evaluation not found', 404));
        }

        const assignments = await prisma.assignment.findMany({
            where: {
                evaluationId,
                evaluatorId
            },
            include: {
                evaluatee: true,
                results: true
            }
        });

        // Also fetch the evidence from evaluatees
        const evidenceList = await prisma.evidence.findMany({
            where: {
                evaluateeId: { in: assignments.map(a => a.evaluateeId) },
                indicatorId: { in: evaluation.topics.flatMap(t => t.indicators.map(i => i.id)) }
            }
        });

        res.status(200).json({ status: 'success', data: { evaluation, assignments, evidence: evidenceList } });
    } catch (err) { next(err); }
};

exports.getAssignmentDetails = async (req, res, next) => {
    try {
        const assignmentId = parseInt(req.params.id);
        const evaluatorId = req.user.id;

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                evaluatee: true,
                evaluation: {
                    include: {
                        topics: {
                            include: { indicators: true }
                        }
                    }
                },
                results: true
            }
        });

        if (!assignment || assignment.evaluatorId !== evaluatorId) {
            return next(new AppError('Assignment not found or unauthorized', 404));
        }

        const evidence = await prisma.evidence.findMany({
            where: {
                evaluateeId: assignment.evaluateeId,
                indicatorId: {
                    in: assignment.evaluation.topics.flatMap(t => t.indicators.map(i => i.id))
                }
            }
        });

        res.status(200).json({ status: 'success', data: { assignment, evidence } });
    } catch (err) { next(err); }
};
exports.giveScore = async (req, res, next) => {
    try {
        const assignmentId = parseInt(req.params.id);
        const evaluatorId = req.user.id;
        const { indicatorId, score } = req.body;

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { evaluation: true }
        });

        if (!assignment || assignment.evaluatorId !== evaluatorId) {
            return next(new AppError('Assignment not found or you are not authorized to score this assignment', 403));
        }

        const indicator = await prisma.indicator.findUnique({
            where: { id: parseInt(indicatorId) }
        });

        if (!indicator) {
            return next(new AppError('Indicator not found', 404));
        }

        if (indicator.requireEvidence) {
            const evidence = await prisma.evidence.findUnique({
                where: {
                    indicatorId_evaluateeId: {
                        indicatorId: indicator.id,
                        evaluateeId: assignment.evaluateeId
                    }
                }
            });
            if (!evidence) {
                return next(new AppError('Evidence is required before giving score for this indicator', 400));
            }
        }

        // Upsert the score
        const result = await prisma.evaluationResult.upsert({
            where: {
                assignmentId_indicatorId: {
                    assignmentId: assignment.id,
                    indicatorId: indicator.id
                }
            },
            update: { score: parseInt(score) },
            create: {
                assignmentId: assignment.id,
                indicatorId: indicator.id,
                score: parseInt(score)
            }
        });

        res.status(200).json({ status: 'success', data: { result } });
    } catch (err) {
        console.error("GIVE SCORE ERROR:", err);
        next(err);
    }
};
