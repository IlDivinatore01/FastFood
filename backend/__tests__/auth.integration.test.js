import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';

// Mock dependencies
jest.unstable_mockModule('../utils/mealsImporter.js', () => ({
    importMeals: jest.fn(),
}));

// Dynamic import for app to ensure mocks are applied
const { default: app } = await import('../server.js');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect(); // Disconnect any existing connection
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Auth Integration Tests', () => {
    let userCookie;

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .field('username', 'testuser')
            .field('firstName', 'Test')
            .field('lastName', 'User')
            .field('email', 'test@example.com')
            .field('password', 'Password123!')
            .field('confirmPassword', 'Password123!')
            .field('type', 'customer')
            .attach('image', Buffer.from('fakeimage'), 'test.jpg'); // Mock image upload

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'User successfully registered!');
    });

    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'Password123!'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'User logged in successfully.');
        expect(res.headers['set-cookie']).toBeDefined();

        userCookie = res.headers['set-cookie'];
    });

    it('should not login with invalid password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'WrongPassword!'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Wrong Password.');
    });

    it('should logout successfully', async () => {
        const res = await request(app)
            .get('/auth/logout')
            .set('Cookie', userCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'User logged out successfully.');
    });
});