const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const makeAdmin = async () => {
    try {
        await connectDB();

        const email = 'admin@example.com';
        const user = await User.findOne({ email });

        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`✅ User ${email} is now an Admin`);
        } else {
            console.log(`❌ User ${email} not found. Ensure they are registered first.`);
        }
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
};

makeAdmin();
