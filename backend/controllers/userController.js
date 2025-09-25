/**
 * User management controller for profile operations and user data handling.
 * 
 * This controller provides comprehensive user management functionality:
 * - User profile viewing and editing capabilities
 * - Password change and account security operations
 * - Profile image upload and management
 * - User account activation/deactivation
 * - User data retrieval for authenticated users
 * - Account deletion and data cleanup
 * 
 * Handles both customer and restaurant owner profile management with
 * appropriate authorization checks.
 */

import User from '../models/User.js';
import CustomerData from '../models/CustomerData.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import bcrypt from 'bcrypt';
import { USER_TYPES } from '../utils/constants.js';
import jwt from 'jsonwebtoken';

export const getProfile = async (req, res, next) => {
    try{
        const user = req.user;

        const profile = await User.findById(user.userId).select('-password -__v');
        if (!profile) return res.status(404).json({ error: 'User not found.' });

        let customerData = null;
        let restaurant = null;

        if (profile.type === USER_TYPES.CUSTOMER) customerData = await CustomerData.findOne({ user: user.userId }).select('-__v');
        else restaurant = await Restaurant.findOne({ owner: user.userId }).select('-__v');

        res.json({ profile, cards: customerData ? customerData.cards : null, address: customerData ? customerData.address : null, restaurant: restaurant});
    } catch(err){
        next(err);
    }
}

export const finalizeSetup = async (req, res, next) => {
    try {
        const user = req.user;
        const address = req.body.address;
        const cardData = req.body.card;

        // Validate that the user is a customer
        if (user.type !== USER_TYPES.CUSTOMER) {
            return res.status(403).json({ error: 'Only customers can finalize profile with address and card.' });
        }

        // Sanitize the card data to match schema validation
        const sanitizedCardData = {
            cardOwner: cardData.cardOwner?.trim(),
            cardNumber: cardData.cardNumber?.replace(/\s+/g, ''), // Remove all spaces
            expiryDate: cardData.expiryDate?.trim(),
            cvc: cardData.cvc?.trim()
        };

        // Create the document structure step by step
        const docStructure = {
            user: user.userId,
            address: {
                streetAddress: address.streetAddress?.trim(),
                city: address.city?.trim(),
                province: address.province?.trim().toUpperCase(),
                zipCode: address.zipCode?.trim()
            },
            cards: [sanitizedCardData]
        };

        const customerData = new CustomerData(docStructure);
        
        // Validate before saving
        const validationError = customerData.validateSync();
        if (validationError) {
            // Extract specific validation messages
            const errorMessages = Object.values(validationError.errors).map(err => err.message);
            return res.status(400).json({ error: errorMessages.join('. ') });
        }
        
        await customerData.save();

        // issue a fresh token with setupComplete = true
        const token = jwt.sign(
            { userId: req.user.userId, type: req.user.type, setupComplete: true },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        res.status(201).json({ message: 'Profile finalized successfully.' });
    } catch (err) {
        next(err);
    }
}

export const addCard = async (req, res, next) => {
    try {
        const user = req.user;
        const cardData = req.body.card;

        const customer = await CustomerData.findOne({ user: user.userId });
        if (!customer) {
            return res.status(404).json({ error: 'Customer data not found.' });
        }

        // Add the new card to the array to trigger subdocument validation
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
            { new: true } // Return the updated document
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
            await Order.deleteMany({ customer: profile._id, state: { $ne: 'completed' } });
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
            profile.image = `/images/${req.file.filename}`;
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