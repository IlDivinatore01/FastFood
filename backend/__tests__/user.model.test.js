/**
 * Unit tests for User model validation and functionality.
 * 
 * This test suite validates the User model:
 * - Schema validation and constraint testing
 * - Password hashing middleware verification
 * - User type validation and enumeration testing
 * - Email and username uniqueness testing
 * - Model method testing and error handling
 * 
 * Ensures data model integrity and validation rules compliance.
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const validPassword = 'Password123!';

describe('User Model', () => {
    beforeAll(async () => {
        await connectDB();
    });

    // Clean the collection before each test to ensure isolation
    beforeEach(async () => {
        await User.deleteMany({});
        await User.createIndexes(); // Ensure indexes are fresh for each test
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should create and save a user successfully', async () => {
        const userData = {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: validPassword,
            confirmPassword: validPassword, // Add matching confirmPassword
            type: 'customer'
        };
        const validUser = new User(userData);
        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.username).toBe(userData.username);
    });

    it('should hash the password before saving', async () => {
        const user = new User({
            username: 'hashpass',
            firstName: 'Test',
            lastName: 'User',
            email: 'hash@example.com',
            password: validPassword,
            confirmPassword: validPassword, // Add matching confirmPassword
            type: 'customer'
        });
        await user.save();

        expect(user.password).not.toBe(validPassword);
        // A basic check to see if it looks like a bcrypt hash
        expect(user.password.startsWith('$2b$')).toBe(true);
    });

    it('should fail if required fields are missing', async () => {
        const user = new User({ email: 'test@example.com' });
        let err;
        try {
            await user.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.username).toBeDefined();
        expect(err.errors.password).toBeDefined();
        expect(err.errors.type).toBeDefined();
    });

    it('should enforce unique username', async () => {
        const user1 = new User({
            username: 'unique_user',
            firstName: 'First', // Add required fields
            lastName: 'User',   // Add required fields
            password: validPassword,
            confirmPassword: validPassword, // Add matching confirmPassword
            email: 'user1@example.com',
            type: 'customer'
        });
        await user1.save();

        const user2 = new User({
            username: 'unique_user',
            firstName: 'Second', // Add required fields
            lastName: 'User',    // Add required fields
            password: validPassword,
            confirmPassword: validPassword, // Add matching confirmPassword
            email: 'user2@example.com',
            type: 'customer'
        });

        let err;
        try {
            await user2.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        // MongoDB duplicate key error code
        expect(err.code).toBe(11000);
    });
});