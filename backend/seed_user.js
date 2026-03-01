const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

const seedUser = async () => {
    try {
        await connectDB();

        const existingUser = await User.findOne({ $or: [{ email: 'admin@gmail.com' }, { username: 'admin' }] });
        if (existingUser) {
            console.log('User already exists. Removing...');
            await User.deleteMany({ $or: [{ email: 'admin@gmail.com' }, { username: 'admin' }] });
        }

        const user = await User.create({
            username: 'admin',
            email: 'admin@gmail.com',
            password: 'password123',
            fullName: 'Admin User',
            role: 'admin',
        });

        console.log('User created successfully:', user.email);
        process.exit();
    } catch (error) {
        console.error('Error seeding user:', error);
        process.exit(1);
    }
};

seedUser();
