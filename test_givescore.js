const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBackendScore() {
    try {
        const evaluator = await prisma.user.findFirst({
            where: { role: 'EVALUATOR' }
        });

        if (!evaluator) {
            console.log("No evaluator found.");
            return;
        }

        // Fake Req Res Next
        const assignment = await prisma.assignment.findFirst({
            where: { evaluatorId: evaluator.id },
            include: { evaluation: true }
        });

        if (!assignment) {
            console.log("No assignment found for evaluator: " + evaluator.id);
            return;
        }

        console.log("Found Assignment ID:", assignment.id);

        const indicator = await prisma.indicator.findFirst({
            where: { topic: { evaluationId: assignment.evaluationId } }
        });

        if (!indicator) {
            console.log("No indicators found for evaluation");
            return;
        }

        console.log("Found Indicator ID:", indicator.id);

        // Try to run the exact payload logic
        try {
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
                    throw new Error('Evidence is required before giving score for this indicator');
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
                update: { score: 4 },
                create: {
                    assignmentId: assignment.id,
                    indicatorId: indicator.id,
                    score: 4
                }
            });
            console.log("Success giving score:", result);
        } catch (e) {
            console.log("Caught Error in logic:", e);
        }

    } catch (e) {
        console.log("Outer Error:", e);
    } finally {
        prisma.$disconnect();
    }
}
debugBackendScore();
