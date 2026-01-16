/**
 * Authorization middleware restricting access to customer-only endpoints.
 * 
 * This middleware ensures only authenticated customers can access specific routes:
 * - User type verification (customer role checking)
 * - Access denial for non-customer users
 * - Proper error responses for unauthorized access
 * - Integration with authentication middleware
 * 
 * Used on customer-specific routes like order placement and profile management.
 */

import { USER_TYPES } from '../utils/constants.js';

function onlyCustomersMiddleware(req, res, next) {
    const user = req.user;

    if (user.type !== USER_TYPES.CUSTOMER) {
        return res.status(403).json({ error: 'Forbidden: Access is restricted to customers.' });
    }

    next();
}

export default onlyCustomersMiddleware;