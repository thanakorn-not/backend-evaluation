const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const result = await prisma.evaluationResult.upsert({
            where: {
                assignmentId_indicatorId: {
                    assignmentId: 2,
                    indicatorId: 1
                }
            },
            update: { score: 1 },
            create: {
                assignmentId: 2,
                indicatorId: 1,
                score: 1
            }
        });
        console.log("Success:", result);
    } catch (err) {
        console.error("Prisma error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
test();
