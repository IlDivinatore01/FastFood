/**
 * Owner-Only Middleware
 * 
 * Restricts route access to users with type 'owner'.
 * Returns 403 Forbidden for non-owner users.
 */

export default function onlyOwners(req, res, next) {
    if (req.user?.type !== 'owner') {
        return res.status(403).json({ error: 'Access denied. Restaurant owners only.' });
    }
    next();
}