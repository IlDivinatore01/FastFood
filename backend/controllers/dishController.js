/**
 * Dish Controller
 * 
 * Manages dish-related operations including searching, filtering, and creating dishes.
 * Supports dish search by name, category, and price across all restaurants.
 * Handles custom dish creation by restaurant owners with image uploads.
 */

import Dish from '../models/Dish.js';
import Restaurant from '../models/Restaurant.js';

export const getDishes = async (req, res, next) => {
    try {
        const restaurantId = req.query.restaurant;
        const query = req.query.query;
        const page = req.query.page || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found.' });
        }
        const menuDishes = restaurant.menu.map(item => item.dish);

        const filter = {
            _id: { $nin: menuDishes },
            $or: [
                { restaurant: null },
                { restaurant: { $exists: false } },
                { restaurant: restaurantId }
            ]
        };

        if (query) {
            filter.$and = [{
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } }
                ]
            }];
        }

        const total = await Dish.countDocuments(filter);
        const dishes = await Dish.find(filter).skip(skip).limit(limit);

        res.json({ total, dishes });
    } catch (err) {
        next(err);
    }
}

export const addDish = async (req, res, next) => {
    try {
        const { name, category, ingredients, restaurant } = req.body;
        const image = `/images/uploads/${req.file.filename}`;

        const newDish = new Dish({
            name,
            category,
            ingredients,
            image,
            restaurant
        });

        await newDish.save();
        res.status(201).json({ message: 'Dish added successfully.', dish: newDish });
    } catch (err) {
        next(err);
    }
}

export const searchDishes = async (req, res, next) => {
    try {
        const { name = '', category = '', price, page = 1 } = req.query;
        const limit = 20;
        const skip = (page - 1) * limit;

        const basePipeline = [
            { $unwind: '$menu' },
            { $lookup: { from: 'dishes', localField: 'menu.dish', foreignField: '_id', as: 'menu.dish' } },
            { $unwind: '$menu.dish' },
            {
                $addFields: {
                    'menu.restaurantName': '$name',
                    'menu.restaurantId': '$_id'
                }
            },
            { $replaceRoot: { newRoot: '$menu' } }
        ];

        const matchFilter = {};
        if (name) matchFilter['dish.name'] = { $regex: name, $options: 'i' };
        if (category) matchFilter['dish.category'] = { $regex: category, $options: 'i' };
        if (price) matchFilter['price'] = { $lte: parseInt(price) };

        let fullPipeline = [...basePipeline];
        if (Object.keys(matchFilter).length > 0) {
            fullPipeline.push({ $match: matchFilter });
        }

        const countPipeline = [...fullPipeline, { $count: 'total' }];
        const dataPipeline = [...fullPipeline, { $skip: skip }, { $limit: limit }];

        const totalResult = await Restaurant.aggregate(countPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;
        const dishes = await Restaurant.aggregate(dataPipeline);

        res.json({ total, dishes });
    } catch (err) {
        next(err);
    }
}