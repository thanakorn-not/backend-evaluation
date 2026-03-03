const prisma = require('../utils/db');
const AppError = require('../utils/AppError');

exports.getEvaluationResult = async (req, res, next) => {
    try {
        const evaluationId = parseInt(req.params.evaluationId);
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch the evaluation with indicators
        const evaluation = await prisma.evaluation.findUnique({
            where: { id: evaluationId },
            include: { topics: { include: { indicators: true } } }
        });

        if (!evaluation) {
            return next(new AppError('Evaluation not found', 404));
        }

        const allIndicators = evaluation.topics.flatMap(t => t.indicators);
        const totalIndicatorsCount = allIndicators.length;

        // RBAC conditions
        let assignmentsOptions = { evaluationId };

        if (userRole === 'EVALUATOR') {
            assignmentsOptions.evaluatorId = userId;
        } else if (userRole === 'EVALUATEE') {
            assignmentsOptions.evaluateeId = userId;
        }

        // Admins get everything matching `evaluationId`

        const assignments = await prisma.assignment.findMany({
            where: assignmentsOptions,
            include: {
                evaluator: { select: { id: true, name: true } },
                evaluatee: { select: { id: true, name: true, department: true } },
                results: true
            }
        });

        if (assignments.length === 0) {
            return res.status(200).json({ status: 'success', data: { results: [] } });
        }

        const finalResults = [];

        for (const assignment of assignments) {
            // Check completeness
            if (assignment.results.length < totalIndicatorsCount) {
                if (userRole === 'EVALUATEE') {
                    return next(new AppError('Evaluation is not fully completed yet.', 403));
                } else {
                    // Admin/Evaluator can see incomplete but marked as incomplete
                    finalResults.push({
                        assignmentId: assignment.id,
                        evaluatee: assignment.evaluatee,
                        evaluator: assignment.evaluator,
                        status: 'INCOMPLETE',
                        message: 'Waiting for evaluator to finish scoring'
                    });
                    continue;
                }
            }

            // Calculate score
            let totalScore = 0;
            let breakdown = [];

            for (const indicator of allIndicators) {
                const resultRow = assignment.results.find(r => r.indicatorId === indicator.id);
                const score = resultRow ? resultRow.score : 0;

                let adjusted = 0;
                if (indicator.type === 'SCALE_1_4') {
                    adjusted = (score / 4) * indicator.weight;
                } else if (indicator.type === 'YES_NO') {
                    adjusted = (score === 1 ? 1 : 0) * indicator.weight;
                }

                totalScore += adjusted;
                breakdown.push({
                    indicatorId: indicator.id,
                    name: indicator.name,
                    rawScore: score,
                    adjustedScore: adjusted
                });
            }

            finalResults.push({
                assignmentId: assignment.id,
                evaluatee: assignment.evaluatee,
                evaluator: assignment.evaluator,
                status: 'COMPLETED',
                totalAdjustedScore: totalScore,
                breakdown
            });
        }

        res.status(200).json({ status: 'success', data: { results: finalResults } });
    } catch (err) { next(err); }
};
