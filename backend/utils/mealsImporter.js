/**
 * Data import utility for populating the database with sample meal data.
 * 
 * This utility module handles data seeding operations:
 * - JSON meal data parsing and validation
 * - Database insertion with error handling
 * - Data transformation for application schema compliance
 * - Bulk import operations for efficient seeding
 * - Development and testing data setup
 * 
 * Used for initial application setup and test data generation.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Dish from "../models/Dish.js";

dotenv.config();

export async function importMeals() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const mealsPath = path.join(__dirname, '..', 'meals.json');

        const mealsData = JSON.parse(fs.readFileSync(mealsPath, 'utf-8'));

        for (const meal of mealsData) {
            const existingDish = await Dish.findOne({ name: meal.strMeal });

            if (!existingDish) {
                const newDish = new Dish({
                    name: meal.strMeal,
                    category: meal.strCategory,
                    image: meal.strMealThumb,
                    ingredients: meal.ingredients.filter(i => i && i.trim() !== ''), // Filter out empty ingredients
                });
                await newDish.save();
                console.log(`Imported: ${meal.strMeal}`);
            } // Else: silently skip or log debug
        }

        console.log('Meal import process finished.');
    } catch (error) {
        console.error('Error during meal import:', error);
    }
}