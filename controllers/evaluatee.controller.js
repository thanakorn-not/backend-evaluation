const prisma = require('../utils/db');
const AppError = require('../utils/AppError');

exports.getEvaluations = async (req, res, next) => {
    try {
        const evaluateeId = req.user.id;

        const assignments = await prisma.assignment.findMany({
            where: { evaluateeId },
            include: {
                evaluation: true,
                evaluator: { select: { name: true } }
            }
        });

        res.status(200).json({ status: 'success', data: { assignments } });
    } catch (err) { next(err); }
};

exports.getEvaluationDetails = async (req, res, next) => {
    try {
        const evaluateeId = req.user.id;
        const evaluationId = parseInt(req.params.id);

        const assignment = await prisma.assignment.findFirst({
            where: { evaluateeId, evaluationId },
            include: {
                evaluation: {
                    include: {
                        topics: {
                            include: {
                                indicators: true
                            }
                        }
                    }
                },
                evaluator: { select: { name: true } },
                results: true
            }
        });

        if (!assignment) {
            return next(new AppError('Assignment not found', 404));
        }

        const evidence = await prisma.evidence.findMany({
            where: { evaluateeId, indicator: { topic: { evaluationId } } }
        });

        res.status(200).json({ status: 'success', data: { assignment, evidence } });
    } catch (err) { next(err); }
};

exports.uploadEvidence = async (req, res, next) => {
    try {
        const { indicatorId } = req.body;
        const evaluateeId = req.user.id;
        const evaluationId = parseInt(req.params.evaluationId);

        if (!indicatorId) {
            return next(new AppError('Please provide indicatorId', 400));
        }

        const indicator = await prisma.indicator.findUnique({
            where: { id: parseInt(indicatorId) },
            include: { topic: true }
        });

        if (!indicator) {
            return next(new AppError('Indicator not found', 404));
        }

        if (indicator.topic.evaluationId !== evaluationId) {
            return next(new AppError('Indicator does not belong to this evaluation', 400));
        }

        if (indicator.requireEvidence && !req.file) {
            return next(new AppError('This indicator requires an evidence file', 400));
        }

        if (!req.file) {
            return next(new AppError('No file uploaded', 400));
        }

        // Check if assignments exist for this evaluatee in this evaluation
        const assignment = await prisma.assignment.findFirst({
            where: {
                evaluationId,
                evaluateeId
            }
        });

        if (!assignment) {
            return next(new AppError('You are not assigned to this evaluation', 403));
        }

        // Check if evidence already exists for this indicator and evaluatee
        const existingEvidence = await prisma.evidence.findUnique({
            where: {
                indicatorId_evaluateeId: {
                    indicatorId: parseInt(indicatorId),
                    evaluateeId
                }
            }
        });

        let evidence;
        if (existingEvidence) {
            // Overwrite/Update existing evidence
            evidence = await prisma.evidence.update({
                where: { id: existingEvidence.id },
                data: {
                    filePath: req.file.path,
                    mimeType: req.file.mimetype,
                    sizeBytes: req.file.size
                }
            });
        } else {
            evidence = await prisma.evidence.create({
                data: {
                    indicatorId: parseInt(indicatorId),
                    evaluateeId,
                    filePath: req.file.path,
                    mimeType: req.file.mimetype,
                    sizeBytes: req.file.size
                }
            });
        }

        res.status(200).json({ status: 'success', data: { evidence } });
    } catch (err) { next(err); }
};
