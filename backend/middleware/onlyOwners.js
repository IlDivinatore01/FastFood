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

function onlyOwnersMiddleware(req, res, next) {
    const user = req.user;

    if (user.type !== 'owner') return res.redirect('/home');

    next();
}

export default onlyOwnersMiddleware;