/**
 * Setup completion verification middleware for multi-step user onboarding.
 * 
 * This middleware checks user setup completion status:
 * - Verification of required profile completion steps
 * - Redirection to setup pages for incomplete profiles
 * - Different setup requirements for customers vs. restaurant owners
 * - Setup progress tracking and validation
 * 
 * Ensures users complete all necessary setup steps before accessing full features.
 */

import CustomerData from '../models/CustomerData.js';
import Restaurant from '../models/Restaurant.js';

function setupCheckMiddleware(req, res, next) {
    if (!req.user.setupComplete) {
        if (req.user.type === 'customer') return res.redirect('/finalize');
        else return res.redirect('/restaurant/add');
    }
    next();
}

export { setupCheckMiddleware };
export default async function finalizeSetupMiddleware(req, res, next) {
    try {
        const user = req.user;
        if (user.type === 'customer') {
            const existing = await CustomerData.findOne({ user: user.userId }).select('_id');
            if (existing) return res.status(400).json({ error: 'Profile already finalized.' });
        } else if (user.type === 'owner') {
            const existing = await Restaurant.findOne({ owner: user.userId }).select('_id');
            if (existing) return res.status(400).json({ error: 'Restaurant already exists.' });
        }
        next();
    } catch (err) {
        next(err);
    }
}