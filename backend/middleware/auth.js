/**
 * Authentication middleware for protecting routes and verifying user sessions.
 * 
 * This middleware provides authentication verification:
 * - JWT token validation from HTTP-only cookies
 * - User session verification and token expiry checking
 * - User information extraction and request enrichment
 * - Authentication error handling and responses
 * - Token refresh logic for extended sessions
 * 
 * Applied to all protected routes requiring user authentication.
 */

import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated.' });
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: payload.userId,
            type: payload.type,
            setupComplete: payload.setupComplete
        };
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}