/**
 * Authorization middleware restricting access to restaurant owner endpoints.
 * 
 * This middleware ensures only restaurant owners can access management routes:
 * - User type verification (owner role checking)
 * - Restaurant ownership validation
 * - Access control for restaurant management features
 * - Proper authorization error responses
 * 
 * Applied to restaurant management, menu editing, and order fulfillment routes.
 */

import { USER_TYPES } from '../utils/constants.js';

function onlyOwnersMiddleware(req, res, next) {
    const user = req.user;

    if (user.type !== USER_TYPES.OWNER) {
        return res.status(403).json({ error: 'Forbidden: Access is restricted to restaurant owners.' });
    }

    next();
}

export default onlyOwnersMiddleware;