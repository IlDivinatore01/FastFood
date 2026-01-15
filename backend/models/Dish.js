/**
 * Dish data model representing individual menu items.
 * 
 * This model defines food items available for ordering:
 * - Dish identification (name, description, category)
 * - Pricing and availability information
 * - Nutritional data and ingredient lists
 * - Restaurant association for menu organization
 * - Image URLs for visual presentation
 * - Preparation time and dietary restrictions
 * 
 * Core component of the restaurant menu system and ordering process.
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