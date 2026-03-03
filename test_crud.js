const fs = require('fs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testCrud() {
    console.log("Starting CRUD Tests for check.txt requirements...");
    const apiUrl = 'http://localhost:9999/api';

    // Get token bypass
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
        console.error("No ADMIN user found in DB!");
        return;
    }
    const token = jwt.sign({ id: adminUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const headers = { Authorization: `Bearer ${token}` };
    const resources = ['users', 'periods', 'topics', 'indicators', 'assignments', 'results', 'evidence'];

    const testLog = [];
    const log = (msg) => {
        console.log(msg);
        testLog.push(msg);
    };

    for (const r of resources) {
        log(`\n--- Testing /api/admin/crud/${r} ---`);
        try {
            const listRes = await fetch(`${apiUrl}/admin/crud/${r}?page=1&pageSize=5&sort=id:desc&q=test`, { headers });
            const data = await listRes.json();

            if (listRes.ok) {
                log(`✓ GET /${r} with ?page=1&pageSize=5&sort=id:desc&q=test -> Status: ${listRes.status}, Total: ${data.meta.total}`);
                const dataLength = data.data.length;
                log(`  Data array length: ${dataLength}`);
            } else {
                log(`✗ GET /${r} Failed with Status ${listRes.status}: ${data.message || ''}`);
            }
        } catch (err) {
            log(`✗ GET /${r} Error: ${err.message}`);
        }
    }

    fs.writeFileSync('test_results.txt', testLog.join('\n'));
    log("\nTests complete. Results saved to test_results.txt");
    await prisma.$disconnect();
}

testCrud();
