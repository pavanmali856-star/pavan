const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let userToken = '';
let theaterId = '';
let screenId = '';
let movieId = '';
let showtimeId = '';
const adminEmail = 'admin_test_final@example.com'; // Unique email for this test script to avoid conflicts

const runFlow = async () => {
    try {
        console.log('Starting Backend Verification (Clean State)...');

        // 0. Clean up Validation User
        console.log('Connecting to DB to clean up...');
        await mongoose.connect(process.env.MONGO_URI);

        await User.deleteOne({ email: adminEmail });
        console.log('Old test admin deleted (if existed).');

        await mongoose.disconnect();

        // 1. Authenticate Admin (Register Fresh)
        console.log('Registering Admin...');
        await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Admin User',
            email: adminEmail,
            password: 'adminpassword'
        });

        // 1.5 Promote to Admin
        console.log('Promoting to Admin...');
        await mongoose.connect(process.env.MONGO_URI);
        const adminUser = await User.findOne({ email: adminEmail });
        if (adminUser) {
            adminUser.role = 'admin';
            await adminUser.save();
            console.log('User promoted to Admin.');
        } else {
            throw new Error('Admin user creation failed?');
        }
        await mongoose.disconnect();

        // Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: adminEmail,
            password: 'adminpassword'
        });
        adminToken = loginRes.data.token;
        console.log('Admin Logged In.');

        // 2. Create Theater
        console.log('Creating Theater...');
        const theaterRes = await axios.post(`${BASE_URL}/theaters`, {
            name: 'Grand Cinema ' + Date.now(),
            location: { address: '123 Main St', city: 'Tech City', state: 'TS', zipCode: '10101' }
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        theaterId = theaterRes.data._id;
        console.log('Theater Created:', theaterId);

        // 3. Add Screen
        console.log('Adding Screen...');
        const screenRes = await axios.post(`${BASE_URL}/theaters/${theaterId}/screens`, {
            name: 'IMAX Hall',
            type: 'IMAX',
            capacity: 100,
            seatLayout: [
                { row: 'A', seats: [{ number: 1, type: 'Standard', priceModifier: 0 }, { number: 2, type: 'Standard', priceModifier: 0 }] }
            ]
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        screenId = screenRes.data._id;
        console.log('Screen Created:', screenId);

        // 4. Create Movie
        console.log('Creating Movie...');
        const uniqueMovieTitle = `Inception ${Date.now()}`;
        const movieRes = await axios.post(`${BASE_URL}/movies`, {
            title: uniqueMovieTitle,
            description: 'Dream within a dream',
            genre: ['Sci-Fi'],
            duration: 148,
            language: ['English'],
            releaseDate: new Date(),
            posterUrl: 'http://example.com/poster.jpg',
            trailerUrl: 'http://example.com/trailer.mp4'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        movieId = movieRes.data._id;
        console.log('Movie Created:', movieId);

        // 5. Create Showtime
        console.log('Creating Showtime...');
        const showtimeRes = await axios.post(`${BASE_URL}/showtimes`, {
            movie: movieId,
            theater: theaterId,
            screen: screenId,
            startTime: new Date(Date.now() + 86400000),
            price: 15
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        showtimeId = showtimeRes.data._id;
        console.log('Showtime Created:', showtimeId);

        // 6. User Flow
        console.log('User Flow: Registering...');
        const userEmail = `user${Date.now()}@test.com`;
        const regUser = await axios.post(`${BASE_URL}/auth/register`, { name: 'Customer', email: userEmail, password: 'password' });
        userToken = regUser.data.token;

        console.log('User Flow: Locking Seat...');
        await axios.post(`${BASE_URL}/bookings/lock`, {
            showtimeId,
            seats: [{ row: 'A', number: 1 }]
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        console.log('Seat Locked.');

        console.log('User Flow: Booking Ticket...');
        const bookRes = await axios.post(`${BASE_URL}/bookings`, {
            showtimeId,
            seats: [{ row: 'A', number: 1 }],
            paymentId: 'PAY_TEST_123'
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        console.log('Booking Confirmed:', bookRes.data._id);

        console.log('SUCCESS: Full Flow Verified.');
        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
};

runFlow();
