/**
 * Integration tests for order processing and management workflows.
 * 
 * This test suite validates the complete order system:
 * - Order creation and validation testing
 * - Order status transition verification
 * - Payment processing integration testing
 * - Order history and retrieval testing
 * - Customer and restaurant order management testing
 * 
 * Ensures order processing system reliability and business logic correctness.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import server from '../server.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Dish from '../models/Dish.js';
import Order from '../models/Order.js';
import CustomerData from '../models/CustomerData.js';
import connectDB from '../config/db.js';

const validPassword = 'Password123!';

describe('Order Management API', () => {
    let customerToken, ownerToken;
    let customerId;
    let restaurantId, dishId;

    beforeAll(async () => {
        await connectDB();
        // Clean slate setup
        await User.collection.drop().catch(() => {});
        await Restaurant.collection.drop().catch(() => {});
        await Dish.collection.drop().catch(() => {});
        await Order.collection.drop().catch(() => {});
        await CustomerData.collection.drop().catch(() => {});
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        await Order.deleteMany({});
        await CustomerData.deleteMany({});
        await User.createIndexes();
        await Restaurant.createIndexes();
        await setupTestData();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        await Order.deleteMany({});
        await CustomerData.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    async function setupTestData() {
        // Create and finalize a customer
        await request(server)
            .post('/auth/register')
            .send({
                username: 'testcustomer',
                password: validPassword,
                confirmPassword: validPassword,
                email: 'customer@test.com',
                firstName: 'Test',
                lastName: 'Customer',
                type: 'customer'
            });

        const customerLogin = await request(server)
            .post('/auth/login')
            .send({ username: 'testcustomer', password: validPassword });
        
        customerToken = customerLogin.headers['set-cookie'][0];
        customerId = customerLogin.body.userId;

        // Finalize customer profile
        await request(server)
            .post('/api/finalize')
            .set('Cookie', customerToken)
            .send({
                address: {
                    streetAddress: "123 Test St",
                    city: "TestCity",
                    province: "TC",
                    zipCode: "12345"
                },
                card: {
                    cardOwner: "Test Customer",
                    cardNumber: "1234567890123456",
                    expiryDate: "12/25",
                    cvc: "123"
                }
            });

        // Create an owner and restaurant
        await request(server)
            .post('/auth/register')
            .send({
                username: 'testowner',
                password: validPassword,
                confirmPassword: validPassword,
                email: 'owner@test.com',
                firstName: 'Test',
                lastName: 'Owner',
                type: 'owner'
            });

        const ownerLogin = await request(server)
            .post('/auth/login')
            .send({ username: 'testowner', password: validPassword });
        
        ownerToken = ownerLogin.headers['set-cookie'][0];

        // Create restaurant
        const restaurantRes = await request(server)
            .post('/api/restaurant/add')
            .set('Cookie', ownerToken)
            .send({
                restaurant: {
                    name: "Test Restaurant",
                    vatNumber: "12345678901",
                    phoneNumber: "1234567890",
                    address: {
                        streetAddress: "456 Restaurant Ave",
                        city: "TestCity",
                        province: "TC",
                        zipCode: "12345"
                    }
                }
            });
        
        restaurantId = restaurantRes.body.restaurant;

        // Create a dish
        const dish = await new Dish({
            name: 'Test Pizza',
            category: 'Main',
            ingredients: ['dough', 'cheese', 'tomato'],
            image: '/test/image.jpg'
        }).save();
        dishId = dish._id;

        // Add dish to restaurant menu
        await request(server)
            .put('/api/menu/update')
            .set('Cookie', ownerToken)
            .send({
                restaurant: restaurantId,
                newMenu: [{
                    dish: dishId,
                    price: 1299, // €12.99
                    preparationTime: 15
                }]
            });
    }

    describe('POST /api/order', () => {
        it('should allow a customer to place an order', async () => {
            const orderPayload = {
                order1: {
                    restaurant: restaurantId,
                    dish: dishId,
                    amount: 2,
                    price: 2598 // 2 * €12.99
                }
            };

            const res = await request(server)
                .post('/api/order')
                .set('Cookie', customerToken)
                .send(orderPayload);

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Order received.');

            // Verify order was created in database
            const order = await Order.findOne({ customer: customerId });
            expect(order).not.toBeNull();
            expect(order.amount).toBe(2);
            expect(order.state).toBe('received');
        });

        it('should fail to place order without authentication', async () => {
            const orderPayload = {
                order1: {
                    restaurant: restaurantId,
                    dish: dishId,
                    amount: 1,
                    price: 1299
                }
            };

            const res = await request(server)
                .post('/api/order')
                .send(orderPayload);

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/queue', () => {
        it('should allow restaurant owner to view their queue', async () => {
            // First, place an order
            await request(server)
                .post('/api/order')
                .set('Cookie', customerToken)
                .send({
                    order1: {
                        restaurant: restaurantId,
                        dish: dishId,
                        amount: 1,
                        price: 1299
                    }
                });

            const res = await request(server)
                .get('/api/queue')
                .set('Cookie', ownerToken);

            expect(res.statusCode).toEqual(200);
            expect(res.body.queue).toBeDefined();
            expect(res.body.queue.length).toBe(1);
            expect(res.body.queue[0].state).toBe('received');
        });

        it('should deny access to queue for non-owners', async () => {
            const res = await request(server)
                .get('/api/queue')
                .set('Cookie', customerToken);

            expect(res.statusCode).toEqual(302);
        });
    });

    describe('PUT /api/order/update', () => {
        it('should allow owner to advance order through states', async () => {
            // Place an order first
            await request(server)
                .post('/api/order')
                .set('Cookie', customerToken)
                .send({
                    order1: {
                        restaurant: restaurantId,
                        dish: dishId,
                        amount: 1,
                        price: 1299
                    }
                });

            const order = await Order.findOne({ customer: customerId });

            // Advance from 'received' to 'preparing'
            const res1 = await request(server)
                .put('/api/order/update')
                .set('Cookie', ownerToken)
                .send({ orderId: order._id });

            expect(res1.statusCode).toEqual(200);

            // Check order state changed
            const updatedOrder1 = await Order.findById(order._id);
            expect(updatedOrder1.state).toBe('preparing');

            // Advance from 'preparing' to 'ready'
            const res2 = await request(server)
                .put('/api/order/update')
                .set('Cookie', ownerToken)
                .send({ orderId: order._id });

            expect(res2.statusCode).toEqual(200);

            const updatedOrder2 = await Order.findById(order._id);
            expect(updatedOrder2.state).toBe('ready');
        });
    });

    describe('PUT /api/confirmpickup/:id', () => {
        it('should allow customer to confirm pickup of ready order', async () => {
            // Create and advance an order to 'ready' state
            await request(server)
                .post('/api/order')
                .set('Cookie', customerToken)
                .send({
                    order1: {
                        restaurant: restaurantId,
                        dish: dishId,
                        amount: 1,
                        price: 1299
                    }
                });

            const order = await Order.findOne({ customer: customerId });
            
            // Advance to 'ready' state
            await Order.findByIdAndUpdate(order._id, { state: 'ready' });

            const res = await request(server)
                .put(`/api/confirmpickup/${order._id}`)
                .set('Cookie', customerToken);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Order completed.');

            const completedOrder = await Order.findById(order._id);
            expect(completedOrder.state).toBe('completed');
        });

        it('should fail to confirm pickup of non-ready order', async () => {
            await request(server)
                .post('/api/order')
                .set('Cookie', customerToken)
                .send({
                    order1: {
                        restaurant: restaurantId,
                        dish: dishId,
                        amount: 1,
                        price: 1299
                    }
                });

            const order = await Order.findOne({ customer: customerId });

            const res = await request(server)
                .put(`/api/confirmpickup/${order._id}`)
                .set('Cookie', customerToken);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Order not ready for pickup.');
        });
    });
});