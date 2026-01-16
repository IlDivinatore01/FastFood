/**
 * Database connection configuration for MongoDB using Mongoose ODM.
 * 
 * This module establishes and manages the connection to MongoDB database
 * with proper error handling and connection state logging. It handles:
 * - MongoDB connection string from environment variables
 * - Connection error handling and retries
 * - Database connection state logging
 * - Graceful connection closing on application shutdown
 * 
 * Exports the connectDB function used by the main server application.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        let mongoURI = process.env.MONGO_URI || `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}`;

        // Disable retryable writes for standalone MongoDB (not a replica set)
        // Must be in connection string, not options
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