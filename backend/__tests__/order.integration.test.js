
import request from 'supertest';
import mongoose from 'mongoose';
import server from '../server.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Dish from '../models/Dish.js';
import Order from '../models/Order.js';
import connectDB from '../config/db.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

const validPassword = 'Password123!';

describe('Order Integration Tests', () => {
    let customerCookie;
    let restaurantCookie;
    let dishId;
    let restaurantId;

    let mongoServer;

    beforeAll(async () => {
        // Force SKIP_TRANSACTIONS for test env
        process.env.SKIP_TRANSACTIONS = 'true';
        process.env.NODE_ENV = 'test';

        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        await mongoose.disconnect();
        await mongoose.connect(uri);

        // Force clean start
        await User.collection.drop().catch(() => { });
        await Restaurant.collection.drop().catch(() => { });
        await Dish.collection.drop().catch(() => { });
        await Order.collection.drop().catch(() => { });
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        await Order.deleteMany({});

        await setupTestData();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
        // server.close() is not needed as we imported the app instance but supervises might be running? 
        // actually we imported 'server' which is the return of startServer.
        if (server) server.close();
    });

    async function setupTestData() {
        // 1. Register Customer
        await request(server)
            .post('/auth/register')
            .send({
                username: 'ordercustomer',
                password: validPassword,
                confirmPassword: validPassword,
                email: 'ordercust@test.com',
                firstName: 'Order',
                lastName: 'Customer',
                type: 'customer'
            });

        const loginCust = await request(server)
            .post('/auth/login')
            .send({ username: 'ordercustomer', password: validPassword });
        customerCookie = loginCust.headers['set-cookie'][0];

        // 2. Register Restaurant Owner
        await request(server)
            .post('/auth/register')
            .send({
                username: 'orderowner',
                password: validPassword,
                confirmPassword: validPassword,
                email: 'orderowner@test.com',
                firstName: 'Order',
                lastName: 'Owner',
                type: 'owner'
            });

        const loginOwner = await request(server)
            .post('/auth/login')
            .send({ username: 'orderowner', password: validPassword });
        restaurantCookie = loginOwner.headers['set-cookie'][0];

        // 3. Create Restaurant
        const restRes = await request(server)
            .post('/api/restaurant/add')
            .set('Cookie', restaurantCookie)
            .send({
                restaurant: {
                    name: "Order Test Rest",
                    vatNumber: "11122233344",
                    phoneNumber: "1234567890",
                    address: {
                        streetAddress: "Order St",
                        city: "TestCity",
                        province: "TS",
                        zipCode: "12345"
                    }
                }
            });

        restaurantId = restRes.body.restaurant;

        // 4. Create Dish
        const dishRes = await request(server)
            .post('/api/dish/add')
            .set('Cookie', restaurantCookie)
            .field('name', "Order Dish")
            .field('price', 1000)
            .field('description', "Yummy")
            .field('category', "Test")
            .field('ingredients', "Ing1")
            .field('restaurant', restaurantId)
            .attach('image', Buffer.from('fakeimage'), 'dish.jpg');

        dishId = dishRes.body.dish;

        // 5. Finalize Customer Profile
        await request(server)
            .post('/api/finalize')
            .set('Cookie', customerCookie)
            .send({
                address: { streetAddress: 'S', city: 'C', province: 'P', zipCode: '1' },
                card: { cardOwner: 'Me', cardNumber: '1234567812345678', expiryDate: '12/30', cvc: '123' }
            });
    }

    it('should create a new order', async () => {
        const cartKey = `${restaurantId}:${dishId}`;
        const orderPayload = {
            [cartKey]: {
                restaurant: restaurantId,
                dish: dishId,
                amount: 2,
                price: 1000
            }
        };

        const res = await request(server)
            .post('/api/order')
            .set('Cookie', customerCookie)
            .send(orderPayload);



        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Order received.');
    });

    it('should retrieve orders for customer', async () => {
        // Need to create an order first because beforeEach wipes data
        const cartKey = `${restaurantId}:${dishId}`;
        const orderPayload = {
            [cartKey]: {
                restaurant: restaurantId,
                dish: dishId,
                amount: 2,
                price: 1000
            }
        };
        await request(server)
            .post('/api/order')
            .set('Cookie', customerCookie)
            .send(orderPayload);

        const res = await request(server)
            .get('/api/orders')
            .set('Cookie', customerCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.orders).toHaveLength(1);
    });
});