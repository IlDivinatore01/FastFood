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
    } catch (err) {
        next(err);
    }
}

export const newOrder = async (req, res, next) => {
    let session = null;
    if (process.env.SKIP_TRANSACTIONS !== 'true') {
        session = await mongoose.startSession();
        session.startTransaction();
    }

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

            // Only pass session if it exists
            const saveOptions = session ? { session } : {};
            await newOrder.save(saveOptions);

            const updateOptions = session ? { session } : {};
            await Restaurant.findByIdAndUpdate(order.restaurant, { $push: { queue: newOrder._id } }, updateOptions);
        }

        if (session) {
            await session.commitTransaction();
        }
        res.status(201).json({ message: 'Order received.' });
    } catch (err) {
        if (session) {
            await session.abortTransaction();
        }
        next(err);
    } finally {
        if (session) {
            session.endSession();
        }
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

        // Atomic find and verify restaurant ownership
        const restaurant = await Restaurant.findOne({ owner: user.userId }).select('_id queue');
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

        // Determine which order to advance
        const targetOrderId = orderId || restaurant.queue[0];
        if (!targetOrderId) return res.json({ message: 'Queue is empty.' });

        const orderToAdvance = await Order.findById(targetOrderId);
        if (!orderToAdvance || String(orderToAdvance.restaurant) !== String(restaurant._id)) {
            return res.status(404).json({ error: 'Order not found in this restaurant.' });
        }

        const isHeadOfQueue = restaurant.queue[0]?.toString() === targetOrderId.toString();

        if (orderToAdvance.state === ORDER_STATES.RECEIVED) {
            // Atomic update: mark as preparing
            const updated = await Order.findOneAndUpdate(
                { _id: targetOrderId, state: ORDER_STATES.RECEIVED },
                { $set: { state: ORDER_STATES.PREPARING } },
                { new: true }
            );
            if (!updated) return res.status(409).json({ error: 'Order state changed concurrently.' });

            if (isHeadOfQueue) {
                await Restaurant.findByIdAndUpdate(restaurant._id, { lastPreparationStart: Date.now() });
            }
        } else if (orderToAdvance.state === ORDER_STATES.PREPARING) {
            // Atomic update: mark as ready and remove from queue
            const updated = await Order.findOneAndUpdate(
                { _id: targetOrderId, state: ORDER_STATES.PREPARING },
                { $set: { state: ORDER_STATES.READY } },
                { new: true }
            );
            if (!updated) return res.status(409).json({ error: 'Order state changed concurrently.' });

            await Restaurant.findByIdAndUpdate(restaurant._id, { $pull: { queue: targetOrderId } });
        }

        res.json({ message: 'Queue advanced successfully.' });
    } catch (err) {
        next(err);
    }
}

export const waitEstimation = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const restaurant = await Restaurant.findById(order.restaurant);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

        // Find position in queue
        const queuePosition = restaurant.queue.findIndex(id => id.toString() === orderId);
        if (queuePosition === -1) {
            // Not in queue - already completed or ready
            return res.json({ time: 0 });
        }

        // Get orders ahead in queue (including current)
        const orderIdsAhead = restaurant.queue.slice(0, queuePosition + 1);

        // Aggregate preparation times using MongoDB pipeline
        const result = await Order.aggregate([
            { $match: { _id: { $in: orderIdsAhead } } },
            {
                $lookup: {
                    from: 'restaurants',
                    let: { restaurantId: '$restaurant', dishId: '$dish' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$restaurantId'] } } },
                        { $unwind: '$menu' },
                        { $match: { $expr: { $eq: ['$menu.dish', '$$dishId'] } } },
                        { $project: { prepTime: '$menu.preparationTime' } }
                    ],
                    as: 'menuData'
                }
            },
            { $unwind: { path: '$menuData', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    totalTime: { $sum: { $multiply: ['$amount', { $ifNull: ['$menuData.prepTime', 0] }] } }
                }
            }
        ]);

        let waitingTime = result[0]?.totalTime || 0;

        // Adjust for currently preparing order (subtract elapsed time)
        const firstOrderId = restaurant.queue[0];
        if (firstOrderId) {
            const firstOrder = await Order.findById(firstOrderId);
            if (firstOrder?.state === ORDER_STATES.PREPARING && restaurant.lastPreparationStart) {
                const elapsedMinutes = (Date.now() - new Date(restaurant.lastPreparationStart).getTime()) / (60 * 1000);
                waitingTime = Math.max(waitingTime - elapsedMinutes, 0);
            }
        }

        res.json({ time: Math.round(waitingTime * 10) / 10 });
    } catch (err) {
        next(err);
    }
}