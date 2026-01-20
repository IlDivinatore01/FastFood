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
            return res.redirect('/finalize');
        }
        return res.status(403).json({ error: 'Please complete your profile setup first.', setupRequired: true });
    }
    next();
}