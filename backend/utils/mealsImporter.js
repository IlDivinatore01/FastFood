/**
 * Meals Importer
 * 
 * Seeds the database with dish data from meals.json on startup.
 * Skips dishes that already exist.
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
                    ingredients: meal.ingredients.filter(i => i && i.trim() !== ''),
                });
                await newDish.save();
                console.log(`Imported: ${meal.strMeal}`);
            }
        }

        console.log('Meal import process finished.');
    } catch (error) {
        console.error('Error during meal import:', error);
    }
}