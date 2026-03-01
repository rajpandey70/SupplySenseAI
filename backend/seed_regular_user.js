const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

const seedRegularUser = async () => {
    try {
        await connectDB();

        const existingUser = await User.findOne({ email: 'user@gmail.com' });
        if (existingUser) {
            console.log('User already exists. Removing...');
            await User.deleteOne({ email: 'user@gmail.com' });
        }

        const user = await User.create({
            username: 'user',
            email: 'user@gmail.com',
            password: 'password123',
            fullName: 'Regular User',
            role: 'user',
        });

        console.log('Regular user created successfully:', user.email);
        process.exit();
    } catch (error) {
        console.error('Error seeding regular user:', error);
        process.exit(1);
    }
};

seedRegularUser();
