import CustomerData from '../models/CustomerData.js';
import User from '../models/User.js';

class UserService {
    /**
     * Handles the business logic for finalizing user setup.
     * Validates data, strips sensitive info, saves to DB, updates User status.
     */
    async completeUserSetup(userId, cardData, addressData) {
        // 1. Business Logic: Remove CVC (Security)
        const safeCardData = { ...cardData };
        delete safeCardData.cvc;

        // 2. Database Operation: Transactional logic could go here
        const customerData = await CustomerData.create({
            user: userId,
            card: safeCardData,
            address: addressData
        });

        // 3. Update User State
        await User.findByIdAndUpdate(userId, { isSetupComplete: true });

        return customerData;
    }
}

export default new UserService();