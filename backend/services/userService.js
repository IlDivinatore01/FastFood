/**
 * User Service
 * 
 * Business logic for user setup operations.
 * Handles card data sanitization and customer data creation.
 */

import CustomerData from '../models/CustomerData.js';
import User from '../models/User.js';

class UserService {
    async completeUserSetup(userId, cardData, addressData) {
        const safeCardData = { ...cardData };
        delete safeCardData.cvc;

        const customerData = await CustomerData.create({
            user: userId,
            card: safeCardData,
            address: addressData
        });

        return customerData;
    }
}

export default new UserService();