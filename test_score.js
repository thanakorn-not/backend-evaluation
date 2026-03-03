const axios = require('axios');

async function test() {
    try {
        // Need to login first to get the token
        const loginRes = await axios.post('http://localhost:9999/api/auth/login', {
            email: 'evaluator1@example.com', // we don't know the exact email
            password: 'password123'
        });
    } catch (err) {
        console.error("Login failed or no server:", err.message);
    }
}
test();
