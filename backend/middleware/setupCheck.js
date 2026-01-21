/**
 * Setup Check Middleware
 * 
 * Ensures users have completed their profile setup before accessing protected routes.
 * Customers must have address/card, owners must have restaurant registered.
 * Redirects incomplete profiles to the appropriate setup page.
 */

export default function setupCheck(req, res, next) {
    if (!req.user?.setupComplete) {
        if (req.accepts('html')) {
            if (req.user.type === 'customer') {
                return res.redirect('/finalize');
            } else {
                return res.redirect('/restaurant/add');
            }
        }
        return res.status(403).json({ error: 'Please complete your profile setup first.', setupRequired: true });
    }
    next();
}