/**
 * User Controller
 * 
 * Manages user profiles, account settings, and customer data.
 * Handles profile viewing/editing, password changes, and account deactivation.
 * Manages payment cards (add/remove) and delivery addresses for customers.
 * Supports the customer setup flow (finalize with address and card).
 */

import User from '../models/User.js';
import CustomerData from '../models/CustomerData.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import bcrypt from 'bcrypt';
import { USER_TYPES } from '../utils/constants.js';
import jwt from 'jsonwebtoken';

export const getProfile = async (req, res, next) => {
    try {
        const user = req.user;

        const profile = await User.findById(user.userId).select('-password -__v');
        if (!profile) return res.status(404).json({ error: 'User not found.' });

        let customerData = null;
        let restaurant = null;

        if (profile.type === USER_TYPES.CUSTOMER) customerData = await CustomerData.findOne({ user: user.userId }).select('-__v');
        else restaurant = await Restaurant.findOne({ owner: user.userId }).select('-__v');

        res.json({ profile, cards: customerData ? customerData.cards : null, address: customerData ? customerData.address : null, restaurant: restaurant });
    } catch (err) {
        next(err);
    }
}

export const finalizeSetup = async (req, res, next) => {
    try {
        const existing = await CustomerData.findOne({ user: req.user.userId });

        if (existing) {
            const token = jwt.sign({
                userId: req.user.userId,
                type: req.user.type,
                setupComplete: true
            }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1 * 60 * 60 * 1000
            });

            return res.status(200).json({ success: true, message: 'Profile already active' });
        }

        const { card, address } = req.body;

        if (!card || !address) {
            return res.status(400).json({ error: 'Please provide both card and address details' });
        }

        if (!card.cardNumber || !/^\d{16}$/.test(card.cardNumber)) {
            return res.status(400).json({ error: 'Card number must be exactly 16 digits.' });
        }

        const safeCardData = { ...card };
        safeCardData.cardNumber = '************' + card.cardNumber.slice(-4);
        delete safeCardData.cvc;

        await CustomerData.create({
            user: req.user.userId,
            cards: [safeCardData],
            address: address
        });

        const token = jwt.sign({
            userId: req.user.userId,
            type: req.user.type,
            setupComplete: true
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
}

export const addCard = async (req, res, next) => {
    try {
        const user = req.user;
        const cardData = { ...req.body.card };

        if (!cardData.cardNumber || !/^\d{16}$/.test(cardData.cardNumber)) {
            return res.status(400).json({ error: 'Card number must be exactly 16 digits.' });
        }

        cardData.cardNumber = '************' + cardData.cardNumber.slice(-4);
        delete cardData.cvc;

        const customer = await CustomerData.findOne({ user: user.userId });
        if (!customer) {
            return res.status(404).json({ error: 'Customer data not found.' });
        }

        customer.cards.push(cardData);

        const validationError = customer.validateSync();
        if (validationError) {
            const errorMessages = Object.values(validationError.errors).map(err => err.message);
            return res.status(400).json({ error: errorMessages.join('. ') });
        }

        await customer.save();

        res.status(201).json({ cards: customer.cards });
    } catch (err) {
        next(err);
    }
}

export const removeCard = async (req, res, next) => {
    try {
        const user = req.user;
        const cardId = req.params.id;

        const updatedCustomer = await CustomerData.findOneAndUpdate(
            { user: user.userId },
            { $pull: { cards: { _id: cardId } } },
            { new: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ error: 'Customer data not found.' });
        }

        res.status(200).json({ cards: updatedCustomer.cards });
    } catch (err) {
        next(err);
    }
}

export const getCards = async (req, res, next) => {
    try {
        const user = req.user;
        const customer = await CustomerData.findOne({ user: user.userId });
        if (!customer || !customer.cards) {
            return res.status(404).json({ error: 'Customer data or cards not found.' });
        }
        const cleanCards = customer.cards.map(card => ({
            _id: card._id,
            cardOwner: card.cardOwner,
            cardNumber: card.cardNumber,
            expiryDate: card.expiryDate
        }));
        res.json(cleanCards);
    } catch (err) {
        next(err);
    }
}

export const deactivateAccount = async (req, res, next) => {
    try {
        const user = req.user;
        const profile = await User.findById(user.userId);
        if (!profile) return res.status(404).json({ error: 'User not found.' });

        const isMatch = await bcrypt.compare(req.body.password, profile.password);
        if (!isMatch) return res.status(400).json({ error: 'Wrong password.' });

        if (profile.type === USER_TYPES.CUSTOMER) {
            const ordersToDelete = await Order.find({
                customer: profile._id,
                state: { $ne: 'completed' }
            }).select('_id');
            const orderIds = ordersToDelete.map(o => o._id);

            if (orderIds.length > 0) {
                await Restaurant.updateMany(
                    { queue: { $in: orderIds } },
                    { $pull: { queue: { $in: orderIds } } }
                );
            }

            await Order.deleteMany({ _id: { $in: orderIds } });
            await CustomerData.deleteOne({ user: profile._id });
            await User.deleteOne({ _id: profile._id });
        } else if (profile.type === USER_TYPES.OWNER) {
            const restaurant = await Restaurant.findOne({ owner: profile._id });
            if (restaurant) {
                await Order.deleteMany({ restaurant: restaurant._id, state: { $ne: 'completed' } });
                await Restaurant.deleteOne({ _id: restaurant._id });
            }
            await User.deleteOne({ _id: profile._id });
        }

        res.clearCookie('token');
        res.json({ success: true, message: 'Account and related data deleted.' });
    } catch (err) {
        next(err);
    }
}

export const editProfile = async (req, res, next) => {
    try {
        const user = req.user;
        const newProfile = req.body.newProfile || {};

        const profile = await User.findById(user.userId);
        if (!profile) return res.status(404).json({ error: 'User not found.' });

        if (newProfile.newPassword) {
            if (!newProfile.password) {
                return res.status(400).json({ error: 'Current password is required to set a new password.' });
            }

            const isMatch = await bcrypt.compare(newProfile.password, profile.password);
            if (!isMatch) return res.status(400).json({ error: 'Wrong password.' });

            if (newProfile.newPassword !== newProfile.confirmPassword) {
                return res.status(400).json({ error: 'Passwords do not match.' });
            }
            profile.password = newProfile.newPassword;
        }

        profile.firstName = newProfile.firstName || profile.firstName;
        profile.lastName = newProfile.lastName || profile.lastName;
        profile.email = newProfile.email || profile.email;

        if (req.file) {
            profile.image = `/images/uploads/${req.file.filename}`;
        }

        await profile.save();
        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        next(err);
    }
}

export const editAddress = async (req, res, next) => {
    try {
        const user = req.user;
        const address = req.body.address || {};

        const update = {};
        if (address.streetAddress != null) update['address.streetAddress'] = address.streetAddress.trim();
        if (address.city != null) update['address.city'] = address.city.trim();
        if (address.province != null) update['address.province'] = address.province.trim().toUpperCase();
        if (address.zipCode != null) update['address.zipCode'] = address.zipCode.trim();

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ error: 'No address fields provided.' });
        }

        await CustomerData.findOneAndUpdate(
            { user: user.userId },
            { $set: update },
            { runValidators: true }
        );
        res.json({ message: 'Address updated successfully.' });
    } catch (err) {
        next(err);
    }
}