/**
 * Order processing controller managing the complete order lifecycle.
 * 
 * This controller orchestrates the entire ordering process:
 * - Order creation and validation from customer requests
 * - Order status updates throughout the fulfillment process
 * - Payment processing integration and verification
 * - Delivery scheduling and tracking functionality
 * - Order history retrieval for customers and restaurants
 * - Order cancellation and refund processing
 * 
 * Central component coordinating between customers, restaurants, and delivery systems.
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { ORDER_STATES } from '../utils/constants.js';

export const getOrders = async (req, res, next) => {
    try {
        const user = req.user;
        const page = req.query.page || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        let filter = {};
        if (user.type === 'customer') filter.customer = user.userId;
        else {
            const restaurant = await Restaurant.findOne({ owner: user.userId });
            if (!restaurant) return res.json({ total: 0, orders: [] });
            filter.restaurant = restaurant._id;
        }

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter).populate('dish').populate('restaurant').populate('customer').sort({ createdAt: -1 }).skip(skip).limit(limit);

        const cleanOrders = orders.map(order => {
            return {
                _id: order._id,
                dish: order.dish,
                restaurant: order.restaurant,
                customer: order.customer,
                amount: order.amount,
                price: order.price,
                state: order.state,
                createdAt: order.createdAt
            }
        });

        res.json({ total, orders: cleanOrders });
    } catch(err){
        next(err);
    }
}

export const newOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = req.user;
        for (const key in req.body) {
            const order = req.body[key];
            const newOrder = new Order({
                customer: user.userId,
                restaurant: order.restaurant,
                dish: order.dish,
                amount: order.amount,
                price: order.price,
                state: 'received',
                createdAt: Date.now()
            });
            await newOrder.save({ session });

            await Restaurant.findByIdAndUpdate(order.restaurant, { $push: { queue: newOrder._id } }, { session });
        }

        await session.commitTransaction();
        res.status(201).json({ message: 'Order received.' });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        session.endSession();
    }
}

export const confirmPickup = async (req, res, next) => {
    try {
        const user = req.user;
        const id = req.params.id;

        const order = await Order.findOne({ _id: id, customer: user.userId });
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        if (order.state !== 'ready') return res.status(400).json({ error: 'Order not ready for pickup.' });

        order.state = 'completed';
        await order.save();

        res.json({ message: 'Order completed.' });
    } catch (err) {
        next(err);
    }
}

export const getQueue = async (req, res, next) => {
    try {
        const user = req.user;
        const restaurant = await Restaurant.findOne({ owner: user.userId }).select('_id');
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

        const queue = await Order.aggregate([
            { $match: { restaurant: restaurant._id, state: { $in: [ORDER_STATES.RECEIVED, ORDER_STATES.PREPARING] } } },
            { $sort: { createdAt: 1 } },
            { $lookup: { from: 'users', localField: 'customer', foreignField: '_id', as: 'customer' } },
            { $unwind: '$customer' },
            { $lookup: { from: 'dishes', localField: 'dish', foreignField: '_id', as: 'dish' } },
            { $unwind: '$dish' },
            { $lookup: { from: 'restaurants', localField: 'restaurant', foreignField: '_id', as: 'restaurantDoc' } },
            { $unwind: '$restaurantDoc' },
            {
                $project: {
                    _id: 1,
                    customer: { name: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] } },
                    dish: { name: '$dish.name', image: '$dish.image' },
                    amount: 1,
                    price: 1,
                    state: 1,
                    prepTime: {
                        $let: {
                            vars: {
                                menuItem: {
                                    $arrayElemAt: [
                                        { $filter: { input: '$restaurantDoc.menu', as: 'item', cond: { $eq: ['$$item.dish', '$dish._id'] } } }, 0
                                    ]
                                }
                            },
                            in: '$$menuItem.preparationTime'
                        }
                    }
                }
            }
        ]);

        res.json({ queue: queue });
    } catch (err) {
        next(err);
    }
}

export const advanceQueue = async (req, res, next) => {
    try {
        const user = req.user;
        const { orderId } = req.body;

        const restaurant = await Restaurant.findOne({ owner: user.userId });
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

        let orderToAdvance;
        if (!orderId) {
            const head = restaurant.queue[0];
            if (!head) return res.json({ message: 'Queue advanced successfully.' });
            orderToAdvance = await Order.findById(head);
        } else {
            orderToAdvance = await Order.findById(orderId);
            if (!orderToAdvance || String(orderToAdvance.restaurant) !== String(restaurant._id)) {
                return res.status(404).json({ error: 'Order not found in this restaurant.' });
            }
        }

        if (orderToAdvance.state === ORDER_STATES.RECEIVED) {
            orderToAdvance.state = ORDER_STATES.PREPARING;
            if (restaurant.queue[0] && String(restaurant.queue[0]) === String(orderToAdvance._id)) {
                restaurant.lastPreparationStart = Date.now();
            }
        } else if (orderToAdvance.state === ORDER_STATES.PREPARING) {
            orderToAdvance.state = ORDER_STATES.READY;
            restaurant.queue.pull(orderToAdvance._id);
        }

        await orderToAdvance.save();
        await restaurant.save();

        res.json({ message: 'Queue advanced successfully.' });
    } catch (err) {
        next(err);
    }
}

export const waitEstimation = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('restaurant');

        const restaurant = await Restaurant.findById(order.restaurant).populate('queue');

        let waitingTime = 0;
        let index = 0;

        for (let queuedOrder of restaurant.queue) {
            const menuItem = restaurant.menu.find(item => item.dish.toString() === queuedOrder.dish.toString());

            if (index === 0 && queuedOrder.state === 'preparing') {
                waitingTime += Math.max(menuItem.preparationTime * queuedOrder.amount - (((Date.now() - restaurant.lastPreparationStart) || 0) / (60 * 1000)),0);
            } else {
                waitingTime += menuItem.preparationTime * queuedOrder.amount;
            }

            if (queuedOrder._id.toString() === orderId) break;
            index++;
        }

        res.json({ time: waitingTime });
    } catch (err) {
        next(err);
    }
}