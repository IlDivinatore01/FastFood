/**
 * Restaurant management controller for restaurant owners and operations.
 * 
 * This controller handles restaurant-specific business logic:
 * - Restaurant profile creation and setup for new owners
 * - Restaurant information updates and menu management
 * - Business hours and operational status management
 * - Restaurant image and branding asset uploads
 * - Menu item creation, editing, and deletion
 * - Order management and fulfillment status updates
 * 
 * Restricted to authenticated restaurant owners with proper authorization.
 */

import Restaurant from '../models/Restaurant.js';
import CustomerData from '../models/CustomerData.js';
import Order from '../models/Order.js';
import jwt from 'jsonwebtoken';

export const addRestaurant = async (req, res, next) => {
    try {
        const user = req.user;
        const restaurant = req.body.restaurant;

        const newRestaurant = new Restaurant({
            owner: user.userId,
            name: restaurant.name,
            address: restaurant.address,
            vatNumber: restaurant.vatNumber,
            phoneNumber: restaurant.phoneNumber,
            image: req.file ? `/images/uploads/${req.file.filename}` : undefined
        });

        await newRestaurant.save();

        const token = jwt.sign(
            { userId: user.userId, type: user.type, setupComplete: true },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        res.status(201).json({ message: 'Restaurant created successfully.', restaurant: newRestaurant._id });
    } catch (err) {
        next(err);
    }
}

export const getNearby = async (req, res, next) => {
    try {
        const user = req.user;

        const userAddress = await CustomerData.findOne({ user: user.userId });
        const nearbyRestaurants = await Restaurant.find({ 'address.zipCode': userAddress.address.zipCode, active: true });

        res.set('Cache-Control', 'no-store');
        res.json({ nearbyRestaurants: nearbyRestaurants });
    } catch (err) {
        next(err);
    }
}

export const getMenu = async (req, res, next) => {
    try {
        const restaurantId = req.params.id;

        const restaurant = await Restaurant.findById(restaurantId).populate('menu.dish');
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

        res.json(restaurant);
    } catch (err) {
        next(err);
    }
}

export const editMenu = async (req, res, next) => {
    try {
        const { restaurant, newMenu } = req.body;

        await Restaurant.findByIdAndUpdate(restaurant, { menu: newMenu });
        res.json({ message: 'Menu updated successfully.' });
    } catch (err) {
        next(err);
    }
}

export const editRestaurant = async (req, res, next) => {
    try {
        const user = req.user;
        const body = req.body;

        const restaurant = await Restaurant.findOne({ owner: user.userId });
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

        // Helper to get value from either bracket format or nested JSON
        const getValue = (bracketKey, nestedPath) => {
            // Try bracket format first (legacy: 'newRestaurant[name]')
            if (body[bracketKey] !== undefined) return body[bracketKey];

            // Try nested JSON format (clean: body.newRestaurant.name)
            if (nestedPath && body.newRestaurant) {
                const keys = nestedPath.split('.');
                let val = body.newRestaurant;
                for (const k of keys) {
                    if (val && val[k] !== undefined) val = val[k];
                    else return undefined;
                }
                return val;
            }
            return undefined;
        };

        // Update name
        const newName = getValue('newRestaurant[name]', 'name');
        if (newName) restaurant.name = newName;

        // Update address fields
        const streetAddress = getValue('newRestaurant[address][streetAddress]', 'address.streetAddress');
        const city = getValue('newRestaurant[address][city]', 'address.city');
        const province = getValue('newRestaurant[address][province]', 'address.province');
        const zipCode = getValue('newRestaurant[address][zipCode]', 'address.zipCode');

        if (streetAddress) restaurant.address.streetAddress = streetAddress;
        if (city) restaurant.address.city = city;
        if (province) restaurant.address.province = province;
        if (zipCode) restaurant.address.zipCode = zipCode;

        // Update phone and VAT
        const phone = getValue('newRestaurant[phoneNumber]', 'phoneNumber');
        if (phone != null) restaurant.phoneNumber = phone;

        const vat = getValue('newRestaurant[vatNumber]', 'vatNumber');
        if (vat) restaurant.vatNumber = vat;

        // Update active status
        if (body.active !== undefined) restaurant.active = body.active;
        if (body.newRestaurant?.active !== undefined) restaurant.active = body.newRestaurant.active;

        // Update image
        if (req.file) {
            restaurant.image = `/images/uploads/${req.file.filename}`;
        }

        await restaurant.save();
        res.json({ message: 'Restaurant updated successfully.' });
    } catch (err) {
        next(err);
    }
}

export const getAnalytics = async (req, res, next) => {
    try {
        const user = req.user;
        const { start, end } = req.query;

        const restaurant = await Restaurant.findOne({ owner: user.userId });
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

        const toDate = (v, fallback) => {
            if (!v) return fallback;

            const num = Number(v);
            if (Number.isFinite(num)) {
                return new Date(num > 1e12 ? num : num * 1000);
            }

            try {
                const d = new Date(v);
                if (isNaN(d.getTime())) {
                    console.warn(`Invalid date format: ${v}`);
                    return fallback;
                }
                return d;
            } catch (error) {
                console.warn(`Date parsing error for value ${v}:`, error);
                return fallback;
            }
        };

        const startDate = toDate(start, new Date(0));
        const endDate = toDate(end, new Date());

        if (startDate > endDate) {
            return res.status(400).json({ error: 'Start date cannot be after end date.' });
        }

        const matchStage = {
            restaurant: restaurant._id,
            createdAt: { $gte: startDate, $lte: endDate }
        };

        const totalStatsPipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalEarned: { $sum: '$price' }
                }
            }
        ];

        const mostOrderedPipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$dish',
                    totalAmount: { $sum: '$amount' },
                    totalEarned: { $sum: '$price' }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'dishes',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'dishData'
                }
            },
            { $unwind: { path: '$dishData', preserveNullAndEmptyArrays: true } }
        ];

        const [totalResult, mostOrderedResult] = await Promise.all([
            Order.aggregate(totalStatsPipeline),
            Order.aggregate(mostOrderedPipeline)
        ]);

        const totals = totalResult[0] || { totalOrders: 0, totalEarned: 0 };
        const mostOrdered = mostOrderedResult[0] || null;

        res.json({
            totalOrders: totals.totalOrders,
            totalEarned: totals.totalEarned,
            avgEarned: totals.totalOrders > 0 ? totals.totalEarned / totals.totalOrders : 0,
            mostOrdered: mostOrdered
        });

    } catch (err) {
        next(err);
    }
}

export const searchRestaurants = async (req, res, next) => {
    try {
        const { name, street, city, page = 1 } = req.query;
        const limit = 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (street) filter['address.streetAddress'] = { $regex: street, $options: 'i' };
        if (city) filter['address.city'] = { $regex: city, $options: 'i' };
        filter.active = true;

        const total = await Restaurant.countDocuments(filter);
        const restaurants = await Restaurant.find(filter).skip(skip).limit(limit);

        res.set('Cache-Control', 'no-store');
        res.json({ total, restaurants });
    } catch (err) {
        next(err);
    }
}