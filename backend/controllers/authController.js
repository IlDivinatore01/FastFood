/**
 * Authentication controller handling user registration, login, and session management.
 * 
 * This controller manages all authentication-related operations:
 * - User registration with validation and password hashing
 * - User login with credential verification and JWT token generation
 * - Session management with secure HTTP-only cookies
 * - Logout functionality with token cleanup
 * - Authentication status checking for protected routes
 * - Setup completion detection for multi-step onboarding
 * 
 * Implements secure authentication using JWT tokens and bcrypt password hashing.
 */

import User from '../models/User.js';
import CustomerData from '../models/CustomerData.js';
import Restaurant from '../models/Restaurant.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res, next) => {
    try {
        const { username, firstName, lastName, email, password, confirmPassword, type } = req.body;
        const newUser = new User({
            username,
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            type,
            image: req.file ? `/images/${req.file.filename}` : undefined
        });

        await newUser.save();

        res.status(201).json({ message: 'User successfully registered!' });
    } catch (err) {
        next(err);
    }
}

export const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username }, '_id username type password');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Wrong Password.' });

        let setupComplete = false;
        let extraData = null;

        if (user.type === 'customer') {
            const customerData = await CustomerData.findOne({ user: user._id });
            if (customerData) {
                setupComplete = true;
                extraData = customerData._id;
            }
        } else { 
            const restaurant = await Restaurant.findOne({ owner: user._id });
            if (restaurant) {
                setupComplete = true;
                extraData = restaurant._id;
            }
        }

        const token = jwt.sign({
            userId: user._id,
            type: user.type,
            setupComplete
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000
        });

        res.json({
            message: 'User logged in successfully.',
            username: user.username,
            userId: user._id, 
            extraData: extraData
        });
    } catch (err) {
        next(err);
    }
}

export const logoutUser = async (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'User logged out successfully.' });
}

export const checkLogin = async (req, res) => {
    const { token } = req.cookies || {};
    if (!token) return res.status(200).json({ ok: false });
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ ok: true });
    } catch {
        return res.status(200).json({ ok: false });
    }
}