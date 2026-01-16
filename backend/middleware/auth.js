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

// SECURITY CHECK: Run immediately on load
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === 'dev_secret_replace_in_prod')) {
    console.error('FATAL ERROR: You are running in production mode with an insecure or default JWT_SECRET.');
    console.error('Please update your docker-compose.yml or environment variables.');
    process.exit(1); // Kill the server to prevent insecure deployment
}

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('FATAL: JWT_SECRET must be defined. Set it in your .env file or environment variables.');
    }

    return secret;
};

export default function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated. Please log in.' });
        }
        const payload = jwt.verify(token, getJwtSecret());
        req.user = {
            userId: payload.userId,
            type: payload.type,
            setupComplete: payload.setupComplete
        };
        next();
    } catch (err) {
        // Specific JWT error messages
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid session. Please log in again.' });
        }
        if (err.name === 'NotBeforeError') {
            return res.status(401).json({ error: 'Session not yet valid. Please try again.' });
        }
        return res.status(401).json({ error: 'Authentication failed. Please log in again.' });
    }
}

// Named exports for JWT configuration
export const jwtSecret = getJwtSecret;
export const jwtExpire = process.env.JWT_EXPIRE || '30d';
export const cookieExpire = process.env.JWT_COOKIE_EXPIRE || 30;