/**
 * Dish Model
 * 
 * Mongoose schema for menu items.
 * Includes name, category, image, ingredients list.
 * Optional restaurant reference (null = global dish from seed data).
 */

import mongoose from 'mongoose';

const DishSchema = new mongoose.Schema({
    name: { type: String, required: true, minLength: 3, maxLength: 100 },
    category: { type: String, required: true, minLength: 3, maxLength: 20 },
    image: { type: String, required: true },
    ingredients: [String],
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
});

const Dish = mongoose.model('Dish', DishSchema);
export default Dish;