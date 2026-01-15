/**
 * Order data model for managing customer food orders.
 * 
 * This model tracks the complete order lifecycle:
 * - Customer and restaurant identification
 * - Ordered items with quantities and customizations
 * - Order status tracking (pending, confirmed, preparing, delivered)
 * - Payment information and total calculation
 * - Delivery details and timing
 * - Order timestamps for tracking and analytics
 * 
 * Central entity for order management and fulfillment workflow.
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