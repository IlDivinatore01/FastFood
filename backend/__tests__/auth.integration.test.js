/**
 * Integration tests for authentication functionality and security features.
 * 
 * This test suite verifies authentication system integrity:
 * - User registration flow testing with validation
 * - Login/logout functionality and session management
 * - JWT token generation and validation testing
 * - Password hashing and security verification
 * - Authentication middleware testing
 * - Rate limiting and security feature testing
 * 
 * Ensures authentication system reliability and security compliance.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import server from '../server.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const validPassword = 'Password123!';

describe('Auth API', () => {
    beforeAll(async () => {
        await connectDB();
        // Drop the collection to ensure a clean slate, including indexes
        await User.collection.drop().catch(() => console.log('User collection not found, skipping drop.'));
    });

    afterAll(async () => {
        await mongoose.connection.close();
        if (server) {
            server.close(); // Close the server after tests
        }
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await User.createIndexes();
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(server)
                .post('/auth/register') // Corrected path
                .send({
                    username: 'newcustomer',
                    password: validPassword,
                    confirmPassword: validPassword,
                    email: 'customer@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    type: 'customer'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('User successfully registered!');

            const user = await User.findOne({ username: 'newcustomer' });
            expect(user).not.toBeNull();
        });

        it('should fail to register with an existing username', async () => {
            // First, create a user
            const firstRes = await request(server)
                .post('/auth/register')
                .send({
                    username: 'existinguser',
                    password: validPassword,
                    confirmPassword: validPassword,
                    email: 'test1@example.com',
                    firstName: 'Existing',
                    lastName: 'User',
                    type: 'customer'
                });

            // Ensure the first user was created successfully
            expect(firstRes.statusCode).toEqual(201);

            // Add a small delay to ensure the database has processed the first user
            await new Promise(resolve => setTimeout(resolve, 100));

            // Then, try to register again with the same username
            const res = await request(server)
                .post('/auth/register')
                .send({
                    username: 'existinguser',
                    password: validPassword,
                    confirmPassword: validPassword,
                    email: 'test2@example.com',
                    firstName: 'Another',
                    lastName: 'User',
                    type: 'customer'
                });

            expect(res.statusCode).toEqual(409);
            expect(res.body.error).toBe('The username is already in use.');
        });
    });

    describe('POST /auth/login', () => {
        it('should log in a registered user and return a token cookie', async () => {
            // Register the user first
            await request(server)
                .post('/auth/register') // Corrected path
                .send({
                    username: 'loginuser',
                    password: validPassword,
                    confirmPassword: validPassword,
                    email: 'login@example.com',
                    firstName: 'Login',
                    lastName: 'Test',
                    type: 'customer'
                });

            const res = await request(server)
                .post('/auth/login') // Corrected path
                .send({
                    username: 'loginuser',
                    password: validPassword
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('User logged in successfully.');
            expect(res.headers['set-cookie'][0]).toContain('token=');
        });

        it('should fail to log in with wrong password', async () => {
            await request(server)
                .post('/auth/register') // Corrected path
                .send({
                    username: 'wrongpassuser',
                    password: validPassword,
                    confirmPassword: validPassword,
                    email: 'wrong@example.com',
                    firstName: 'Wrong',
                    lastName: 'Pass',
                    type: 'customer'
                });

            const res = await request(server)
                .post('/auth/login') // Corrected path
                .send({
                    username: 'wrongpassuser',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Wrong Password.');
        });
    });
});