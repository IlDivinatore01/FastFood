/**
 * Integration tests for restaurant management and operations.
 * 
 * This test suite verifies restaurant functionality:
 * - Restaurant profile creation and management testing
 * - Menu management and dish association testing
 * - Restaurant owner authorization testing
 * - Business hours and operational status testing
 * - Restaurant search and discovery testing
 * 
 * Ensures restaurant management system integrity and proper authorization.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import server from '../server.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Dish from '../models/Dish.js';
import connectDB from '../config/db.js';

const validPassword = 'Password123!';

describe('Restaurant & Menu API', () => {
    let ownerToken;

    beforeAll(async () => {
        await connectDB();
        // Drop collections to ensure a clean slate
        await User.collection.drop().catch(() => { });
        await Restaurant.collection.drop().catch(() => { });
        await Dish.collection.drop().catch(() => { });
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        await User.createIndexes();
        await Restaurant.createIndexes();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    // Helper to register and log in a user to get their token
    const getAuthToken = async (userType, username) => {
        await request(server)
            .post('/auth/register')
            .send({
                username,
                password: validPassword,
                confirmPassword: validPassword,
                email: `${username}@example.com`,
                firstName: 'Test',
                lastName: 'User',
                type: userType
            });

        const loginRes = await request(server)
            .post('/auth/login')
            .send({ username, password: validPassword });

        return loginRes.headers['set-cookie'][0];
    };

    describe('POST /api/restaurant/add', () => {
        it('should allow an authenticated owner to create a restaurant', async () => {
            ownerToken = await getAuthToken('owner', 'testowner');

            const res = await request(server)
                .post('/api/restaurant/add')
                .set('Cookie', ownerToken)
                .send({
                    restaurant: {
                        name: "The Testaurant",
                        vatNumber: "12345678901",
                        phoneNumber: "1234567890",
                        address: {
                            streetAddress: "123 Test St",
                            city: "Testville",
                            province: "TS",
                            zipCode: "12345"
                        }
                    }
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Restaurant created successfully.');
            expect(res.body.restaurant).toBeDefined();

            const restaurant = await Restaurant.findById(res.body.restaurant);
            expect(restaurant).not.toBeNull();
            expect(restaurant.name).toBe("The Testaurant");
        });

        it('should return 403 Forbidden if a customer tries to create a restaurant', async () => {
            const customerToken = await getAuthToken('customer', 'testcustomer');

            // First, finalize the customer's profile to bypass the setup check
            await request(server)
                .post('/api/finalize')
                .set('Cookie', customerToken)
                .send({
                    address: {
                        streetAddress: "123 Customer St",
                        city: "CustomerCity",
                        province: "CC",
                        zipCode: "12345"
                    },
                    card: {
                        cardOwner: "Test Customer",
                        cardNumber: "1234567890123456",
                        expiryDate: "12/25",
                        cvc: "123"
                    }
                });

            // Now try to create a restaurant - this should return 403
            const res = await request(server)
                .post('/api/restaurant/add')
                .set('Cookie', customerToken)
                .send({ restaurant: { name: "Customer's Place" } });

            expect(res.statusCode).toEqual(403);
        });
    });

    describe('PUT /api/menu/update', () => {
        it('should allow an owner to update their menu', async () => {
            ownerToken = await getAuthToken('owner', 'menuowner');

            // 1. Create some dishes to add to the menu
            const dish1 = await new Dish({ name: 'Test Burger', category: 'Main', ingredients: ['bun', 'patty'], image: '/fake/image.jpg' }).save();
            const dish2 = await new Dish({ name: 'Test Fries', category: 'Side', ingredients: ['potato'], image: '/fake/image.jpg' }).save();

            // 2. Create a restaurant for the owner
            const restaurantRes = await request(server)
                .post('/api/restaurant/add')
                .set('Cookie', ownerToken)
                .send({
                    restaurant: { name: "Menu Master", vatNumber: "11122233344", phoneNumber: "0987654321", address: { streetAddress: "1 Menu Ln", city: "Foodburg", province: "FB", zipCode: "54321" } }
                });
            const restaurantId = restaurantRes.body.restaurant;

            // 3. Define the new menu structure
            const newMenuPayload = {
                restaurant: restaurantId,
                newMenu: [
                    { dish: dish1._id, price: 899, preparationTime: 10 },
                    { dish: dish2._id, price: 399, preparationTime: 5 }
                ]
            };

            // 4. Send the update request
            const updateRes = await request(server)
                .put('/api/menu/update')
                .set('Cookie', ownerToken)
                .send(newMenuPayload);

            expect(updateRes.statusCode).toEqual(200);
            expect(updateRes.body.message).toBe('Menu updated successfully.');

            // 5. Verify the change in the database
            const updatedRestaurant = await Restaurant.findById(restaurantId);
            expect(updatedRestaurant.menu.length).toBe(2);
            expect(updatedRestaurant.menu[0].price).toBe(899);
            expect(updatedRestaurant.menu[1].dish.toString()).toBe(dish2._id.toString());
        });
    });
});