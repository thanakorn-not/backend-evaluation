const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    // Clear the DB (order matters)
    await prisma.evaluationResult.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.indicator.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    console.log('Cleared existing data.');

    // Create Departments
    const devDept = await prisma.department.create({ data: { name: 'Development' } });
    const hrDept = await prisma.department.create({ data: { name: 'Human Resources' } });

    // Create Users
    const passwordHash = await bcrypt.hash('password123', 12);

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@example.com',
            passwordHash,
            role: 'ADMIN',
            departmentId: devDept.id
        }
    });

    const evaluator = await prisma.user.create({
        data: {
            name: 'Evaluator User',
            email: 'evaluator@example.com',
            passwordHash,
            role: 'EVALUATOR',
            departmentId: devDept.id
        }
    });

    const evaluatee = await prisma.user.create({
        data: {
            name: 'Evaluatee User',
            email: 'evaluatee@example.com',
            passwordHash,
            role: 'EVALUATEE',
            departmentId: devDept.id
        }
    });

    // Create Evaluation
    const evaluation = await prisma.evaluation.create({
        data: {
            name: 'Q1 Performance Review - 2026',
            startAt: new Date(),
            endAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            status: 'OPEN'
        }
    });

    // Create Topics & Indicators (Total weight = 100%)
    const topic1 = await prisma.topic.create({
        data: {
            name: 'Technical Skills',
            evaluationId: evaluation.id,
            indicators: {
                create: [
                    { name: 'Code Quality', type: 'SCALE_1_4', weight: 30, requireEvidence: true },
                    { name: 'System Architecture', type: 'SCALE_1_4', weight: 20, requireEvidence: false }
                ]
            }
        }
    });

    const topic2 = await prisma.topic.create({
        data: {
            name: 'Soft Skills',
            evaluationId: evaluation.id,
            indicators: {
                create: [
                    { name: 'Team Collaboration', type: 'SCALE_1_4', weight: 30, requireEvidence: false },
                    { name: 'Attendance on time', type: 'YES_NO', weight: 20, requireEvidence: true }
                ]
            }
        }
    });

    // Create Assignment
    const assignment = await prisma.assignment.create({
        data: {
            evaluationId: evaluation.id,
            evaluatorId: evaluator.id,
            evaluateeId: evaluatee.id
        }
    });

    console.log('Seeding completed.');
    console.log('Accounts:');
    console.log('admin@example.com / password123');
    console.log('evaluator@example.com / password123');
    console.log('evaluatee@example.com / password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
