/**
 * Customer-Only Middleware
 * 
 * Restricts route access to users with type 'customer'.
 * Returns 403 Forbidden for non-customer users.
 */

export default function onlyCustomers(req, res, next) {
    if (req.user?.type !== 'customer') {
        return res.status(403).json({ error: 'Access denied. Customers only.' });
    }
    next();
}