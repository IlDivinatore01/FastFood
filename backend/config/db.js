/**
 * Database Configuration
 * 
 * MongoDB connection using Mongoose. Reads URI from environment variables.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        let mongoURI = process.env.MONGO_URI || `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}`;

        if (!mongoURI.includes('retryWrites')) {
            const separator = mongoURI.includes('?') ? '&' : '?';
            mongoURI = `${mongoURI}${separator}retryWrites=false`;
        }

        await mongoose.connect(mongoURI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

export default connectDB;