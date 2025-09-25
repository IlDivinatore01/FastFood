/**
 * Order processing service containing business logic for order management.
 * 
 * This service module encapsulates complex order processing logic:
 * - Order validation and business rule enforcement
 * - Price calculation with taxes and fees
 * - Inventory checking and availability validation
 * - Order status transition logic and workflows
 * - Integration with external payment and delivery services
 * - Order analytics and reporting functions
 * 
 * Provides reusable business logic for order-related operations across controllers.
 */

import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

export const calculateWaitTime = async (orderId) => {
    const order = await Order.findById(orderId).populate('restaurant');
    if (!order) {
        throw new Error('Order not found.');
    }

    const restaurant = await Restaurant.findById(order.restaurant._id).populate('queue');
    if (!restaurant) {
        throw new Error('Restaurant not found.');
    }

    let waitingTime = 0;
    let index = 0;

    for (const queuedOrder of restaurant.queue) {
        const menuItem = restaurant.menu.find(item => item.dish.toString() === queuedOrder.dish.toString());
        if (!menuItem) continue;
        if (index === 0 && queuedOrder.state === 'preparing' && restaurant.lastPreparationStart) {
            const timeElapsed = (Date.now() - restaurant.lastPreparationStart) / (60 * 1000); 
            waitingTime += Math.max(menuItem.preparationTime * queuedOrder.amount - timeElapsed, 0);
        } else {
            waitingTime += menuItem.preparationTime * queuedOrder.amount;
        }

        if (queuedOrder._id.toString() === orderId) {
            break;
        }
        index++;
    }

    return waitingTime;
};