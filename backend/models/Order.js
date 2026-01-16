/**
 * Order Model
 * 
 * Mongoose schema for customer orders.
 * Links customer, restaurant, and dish with amount and server-calculated price.
 * Tracks order state: received -> preparing -> ready -> completed.
 */

import mongoose from 'mongoose';
import { ORDER_STATES } from '../utils/constants.js';

const OrderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    dish: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dish',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [1, 'At least one dish must be ordered.']
    },
    price: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        enum: Object.values(ORDER_STATES),
        default: ORDER_STATES.RECEIVED
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ restaurant: 1, createdAt: -1 });

const Order = mongoose.model('Order', OrderSchema);
export default Order;