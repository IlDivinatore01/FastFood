/**
 * Integration tests for dish management and menu operations.
 * 
 * This test suite verifies dish-related functionality:
 * - Dish creation and validation testing
 * - Menu management operations testing
 * - Search and filtering functionality verification
 * - Restaurant-dish relationship testing
 * - Image upload and management testing
 * 
 * Ensures menu management system reliability and data consistency.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import server from '../server.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Dish from '../models/Dish.js';
import connectDB from '../config/db.js';

const validPassword = 'Password123!';

describe('Dish Management API', () => {
    let ownerToken;
    let customerToken; // Add customer token
    let restaurantId;

    beforeAll(async () => {
        await connectDB();
        await User.collection.drop().catch(() => {});
        await Restaurant.collection.drop().catch(() => {});
        await Dish.collection.drop().catch(() => {});
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        await User.createIndexes();
        await Restaurant.createIndexes();
        await setupTestData();
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

    async function setupTestData() {
        // Create owner and restaurant
        await request(server)
            .post('/auth/register')
            .send({
                username: 'dishowner',
                password: validPassword,
                confirmPassword: validPassword,
                email: 'dishowner@test.com',
                firstName: 'Dish',
                lastName: 'Owner',
                type: 'owner'
            });

        const ownerLogin = await request(server)
            .post('/auth/login')
            .send({ username: 'dishowner', password: validPassword });
        
        ownerToken = ownerLogin.headers['set-cookie'][0];

        // Create customer for dish search tests
        await request(server)
            .post('/auth/register')
            .send({
                username: 'dishcustomer',
                password: validPassword,
                confirmPassword: validPassword,
                email: 'dishcustomer@test.com',
                firstName: 'Dish',
                lastName: 'Customer',
                type: 'customer'
            });

        const customerLogin = await request(server)
            .post('/auth/login')
            .send({ username: 'dishcustomer', password: validPassword });
        
        customerToken = customerLogin.headers['set-cookie'][0];

        // Finalize customer profile
        await request(server)
            .post('/api/finalize')
            .set('Cookie', customerToken)
            .send({
                address: {
                    streetAddress: "123 Dish St",
                    city: "DishCity",
                    province: "DC",
                    zipCode: "54321"
                },
                card: {
                    cardOwner: "Dish Customer",
                    cardNumber: "1234567890123456",
                    expiryDate: "12/25",
                    cvc: "123"
                }
            });

        const restaurantRes = await request(server)
            .post('/api/restaurant/add')
            .set('Cookie', ownerToken)
            .send({
                restaurant: {
                    name: "Dish Test Restaurant",
                    vatNumber: "98765432109",
                    phoneNumber: "0987654321",
                    address: {
                        streetAddress: "789 Dish St",
                        city: "DishCity",
                        province: "DC",
                        zipCode: "54321"
                    }
                }
            });
        
        restaurantId = restaurantRes.body.restaurant;
    }

    describe('GET /api/dishes/search', () => {
        beforeEach(async () => {
            // Create test dishes with menu items
            const pizza = await new Dish({
                name: 'Margherita Pizza',
                category: 'Main',
                ingredients: ['dough', 'tomato', 'mozzarella', 'basil'],
                image: '/pizza.jpg'
            }).save();

            const burger = await new Dish({
                name: 'Beef Burger',
                category: 'Main', 
                ingredients: ['bun', 'beef', 'lettuce', 'tomato'],
                image: '/burger.jpg'
            }).save();

            const salad = await new Dish({
                name: 'Caesar Salad',
                category: 'Starter',
                ingredients: ['lettuce', 'croutons', 'parmesan', 'dressing'],
                image: '/salad.jpg'
            }).save();

            // Add dishes to restaurant menu
            await request(server)
                .put('/api/menu/update')
                .set('Cookie', ownerToken)
                .send({
                    restaurant: restaurantId,
                    newMenu: [
                        { dish: pizza._id, price: 1299, preparationTime: 20 },
                        { dish: burger._id, price: 899, preparationTime: 15 },
                        { dish: salad._id, price: 699, preparationTime: 10 }
                    ]
                });
        });

        it('should search dishes by name', async () => {
            const res = await request(server)
                .get('/api/dishes/search?name=pizza')
                .set('Cookie', customerToken); // Add authentication

            expect(res.statusCode).toEqual(200);
            expect(res.body.dishes).toBeDefined();
            expect(res.body.dishes.length).toBe(1);
            expect(res.body.dishes[0].dish.name).toBe('Margherita Pizza');
        });

        it('should search dishes by category', async () => {
            const res = await request(server)
                .get('/api/dishes/search?category=main')
                .set('Cookie', customerToken); // Add authentication

            expect(res.statusCode).toEqual(200);
            expect(res.body.dishes.length).toBe(2);
        });

        it('should filter dishes by maximum price', async () => {
            const res = await request(server)
                .get('/api/dishes/search?price=800') // €8.00
                .set('Cookie', customerToken); // Add authentication

            expect(res.statusCode).toEqual(200);
            expect(res.body.dishes.length).toBe(1);
            expect(res.body.dishes[0].dish.name).toBe('Caesar Salad');
        });

        it('should handle pagination correctly', async () => {
            const res = await request(server)
                .get('/api/dishes/search?page=1')
                .set('Cookie', customerToken); // Add authentication

            expect(res.statusCode).toEqual(200);
            expect(res.body.total).toBe(3);
            expect(res.body.dishes.length).toBe(3);
        });

        it('should return empty results for non-existent dishes', async () => {
            const res = await request(server)
                .get('/api/dishes/search?name=nonexistent')
                .set('Cookie', customerToken); // Add authentication

            expect(res.statusCode).toEqual(200);
            expect(res.body.dishes.length).toBe(0);
            expect(res.body.total).toBe(0);
        });
    });
});