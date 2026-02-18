const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

const runTests = async () => {
    try {
        console.log('--- Starting Auth Verification (Axios) ---');

        // 1. Register User
        console.log('\n1. Testing Registration...');
        const uniqueEmail = `test${Date.now()}@example.com`;
        let token = '';

        try {
            const registerResponse = await axios.post(`${BASE_URL}/register`, {
                name: 'Test User',
                email: uniqueEmail,
                password: 'password123'
            });

            if (registerResponse.status === 201 && registerResponse.data.token) {
                console.log('✅ Registration Successful');
                console.log(`   User ID: ${registerResponse.data._id}`);
                token = registerResponse.data.token;
            }
        } catch (error) {
            console.error('❌ Registration Failed:', error.response ? error.response.data : error.message);
            process.exit(1);
        }

        // 2. Login User
        console.log('\n2. Testing Login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/login`, {
                email: uniqueEmail,
                password: 'password123'
            });

            if (loginResponse.status === 200 && loginResponse.data.token) {
                console.log('✅ Login Successful');
                console.log('   Token received');
                // Ensure we use the login token, though it should be same as register for now
                token = loginResponse.data.token;
            }
        } catch (error) {
            console.error('❌ Login Failed:', error.response ? error.response.data : error.message);
            process.exit(1);
        }

        // 3. Get Me (Protected Route)
        console.log('\n3. Testing Protected Route (/me)...');
        try {
            const meResponse = await axios.get(`${BASE_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (meResponse.status === 200 && meResponse.data.email === uniqueEmail) {
                console.log('✅ Protected Route Verification Successful');
                console.log(`   Fetched Profile for: ${meResponse.data.name}`);
            }
        } catch (error) {
            console.error('❌ Protected Route Failed:', error.response ? error.response.data : error.message);
            process.exit(1);
        }

        console.log('\n-----------------------------------');
        console.log('🎉 All Auth Tests Passed!');
        console.log('-----------------------------------');

    } catch (error) {
        console.error('❌ Error running tests:', error.message);
    }
};

runTests();
