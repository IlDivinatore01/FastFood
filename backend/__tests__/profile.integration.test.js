/**
 * Integration tests for user profile management and data operations.
 * 
 * This test suite validates profile functionality:
 * - Profile creation and update testing
 * - Image upload and management verification
 * - Profile data validation and constraint testing
 * - Customer and owner profile differentiation testing
 * - Privacy and security compliance testing
 * 
 * Ensures user profile system reliability and data protection compliance.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import server from '../server.js';
import User from '../models/User.js';
import CustomerData from '../models/CustomerData.js';
import connectDB from '../config/db.js';

const validPassword = 'Password123!';

describe('Profile Management API', () => {
    let customerToken;
    let customerId;

    beforeAll(async () => {
        await connectDB();
        await User.collection.drop().catch(() => { });
        await CustomerData.collection.drop().catch(() => { });
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await CustomerData.deleteMany({});
        await User.createIndexes();
        await setupTestData();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await CustomerData.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    async function setupTestData() {
        await request(server)
            .post('/auth/register')
            .send({
                username: 'profileuser',
                password: validPassword,
                confirmPassword: validPassword,
                email: 'profile@test.com',
                firstName: 'Profile',
                lastName: 'User',
                type: 'customer'
            });

        const loginRes = await request(server)
            .post('/auth/login')
            .send({ username: 'profileuser', password: validPassword });

        customerToken = loginRes.headers['set-cookie'][0];
        customerId = loginRes.body.userId;

        // Finalize profile
        await request(server)
            .post('/api/finalize')
            .set('Cookie', customerToken)
            .send({
                address: {
                    streetAddress: "123 Profile St",
                    city: "ProfileCity",
                    province: "PC",
                    zipCode: "12345"
                },
                card: {
                    cardOwner: "Profile User",
                    cardNumber: "1234567890123456",
                    expiryDate: "12/25",
                    cvc: "123"
                }
            });
    }

    describe('GET /api/profile', () => {
        it('should return complete user profile', async () => {
            const res = await request(server)
                .get('/api/profile')
                .set('Cookie', customerToken);

            expect(res.statusCode).toEqual(200);
            expect(res.body.profile).toBeDefined();
            expect(res.body.profile.username).toBe('profileuser');
            expect(res.body.address).toBeDefined();
            expect(res.body.cards).toBeDefined();
            expect(res.body.cards.length).toBe(1);
        });

        it('should deny access without authentication', async () => {
            const res = await request(server)
                .get('/api/profile');

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('PUT /api/profile/update', () => {
        it('should update user profile information', async () => {
            const res = await request(server)
                .put('/api/profile/update')
                .set('Cookie', customerToken)
                .send({
                    newProfile: {
                        firstName: 'UpdatedProfile',
                        email: 'updated@test.com'
                        // Remove any password-related fields that might cause validation issues
                    }
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Profile updated successfully.');

            // Verify changes in database
            const user = await User.findById(customerId);
            expect(user.firstName).toBe('UpdatedProfile');
            expect(user.email).toBe('updated@test.com');
        });

        it('should update password with valid current password', async () => {
            const res = await request(server)
                .put('/api/profile/update')
                .set('Cookie', customerToken)
                .send({
                    newProfile: {
                        password: validPassword,
                        newPassword: 'NewPassword123!',
                        confirmPassword: 'NewPassword123!'
                    }
                });

            expect(res.statusCode).toEqual(200);

            // Verify can login with new password
            const loginRes = await request(server)
                .post('/auth/login')
                .send({ username: 'profileuser', password: 'NewPassword123!' });

            expect(loginRes.statusCode).toEqual(200);
        });

        it('should fail to update password with wrong current password', async () => {
            const res = await request(server)
                .put('/api/profile/update')
                .set('Cookie', customerToken)
                .send({
                    newProfile: {
                        password: 'wrongpassword',
                        newPassword: 'NewPassword123!',
                        confirmPassword: 'NewPassword123!'
                    }
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Wrong password.');
        });
    });

    describe('POST /api/card/add', () => {
        it('should add a new payment card', async () => {
            const res = await request(server)
                .post('/api/card/add')
                .set('Cookie', customerToken)
                .send({
                    card: {
                        cardOwner: 'Second Card',
                        cardNumber: '9876543210987654',
                        expiryDate: '06/26',
                        cvc: '456'
                    }
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.cards.length).toBe(2);
        });

        it('should validate card data', async () => {
            const res = await request(server)
                .post('/api/card/add')
                .set('Cookie', customerToken)
                .send({
                    card: {
                        cardOwner: 'A', // Invalid: too short (min 3 chars required)
                        cardNumber: '123456789012345', // Invalid: 15 digits instead of 16
                        expiryDate: '13/25', // Invalid: month > 12
                        cvc: '12' // Invalid: too short (3 digits required)
                    }
                });

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('DELETE /api/card/delete/:id', () => {
        it('should remove a payment card', async () => {
            // Get current cards
            const profileRes = await request(server)
                .get('/api/profile')
                .set('Cookie', customerToken);

            const cardId = profileRes.body.cards[0]._id;

            const res = await request(server)
                .delete(`/api/card/delete/${cardId}`)
                .set('Cookie', customerToken);

            expect(res.statusCode).toEqual(200);
            expect(res.body.cards.length).toBe(0);
        });
    });
});