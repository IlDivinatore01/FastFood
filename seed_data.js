
import mongoose from 'mongoose';
import Restaurant from './backend/models/Restaurant.js';
import Dish from './backend/models/Dish.js';
import User from './backend/models/User.js';
import CustomerData from './backend/models/CustomerData.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // --- Data Definitions ---
        const zipCodes = ['10001', '20002', '90210'];
        const cities = ['Metropolis', 'Gotham', 'Beverly Hills'];

        // Restaurants Configuration
        // 3 in Zip 10001, 2 in Zip 20002, 1 in Zip 90210
        const restaurants = [
            // HUB 10001
            { name: 'Pasta Paradise', cuisine: 'Italian', zip: '10001', city: 'Metropolis' },
            { name: 'Burger Kingdom', cuisine: 'American', zip: '10001', city: 'Metropolis' },
            { name: 'Sushi Master', cuisine: 'Japanese', zip: '10001', city: 'Metropolis' },
            // HUB 20002
            { name: 'Curry House', cuisine: 'Indian', zip: '20002', city: 'Gotham' },
            { name: 'Tacos & Tequila', cuisine: 'Mexican', zip: '20002', city: 'Gotham' },
            // ISOLATED
            { name: 'Green Leaf', cuisine: 'Vegan', zip: '90210', city: 'Beverly Hills' }
        ];

        // Customers Configuration
        const customers = [
            { username: 'cust_10001', zip: '10001', city: 'Metropolis', first: 'Metro', last: 'Citizen' },
            { username: 'cust_20002', zip: '20002', city: 'Gotham', first: 'Gotham', last: 'Dweller' },
            { username: 'cust_isolated', zip: '99999', city: 'Nowhere', first: 'Lone', last: 'Wolf' } // Sees nothing
        ];

        // --- Seeding Logic ---

        // 1. Seed Restaurants & Owners
        for (let i = 0; i < restaurants.length; i++) {
            const r = restaurants[i];
            // Sanitize username: remove non-word chars
            const ownerUsername = `owner_${r.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

            // Sanitize Last Name: remove invalid chars (allow letters, spaces, apostrophes, dots, hyphens)
            // Or easier: just use 'Owner' + i or simpler string if restaurant name is complex.
            // Let's safe-clean the restaurant name for usage as last name:
            const safeLastName = r.name.replace(/[^a-zA-Z\s\.\-']/g, '');

            // Create/Find Owner
            let owner = await User.findOne({ username: ownerUsername });
            if (!owner) {
                owner = await User.create({
                    username: ownerUsername,
                    email: `${ownerUsername}@seed.com`,
                    password: 'Pass123!',
                    confirmPassword: 'Pass123!',
                    firstName: `Owner`,
                    lastName: safeLastName,
                    type: 'owner'
                });
                console.log(`Created Owner: ${ownerUsername}`);
            }

            // Create/Find Restaurant
            let restaurant = await Restaurant.findOne({ name: r.name });
            if (!restaurant) {
                restaurant = new Restaurant({
                    name: r.name,
                    owner: owner._id,
                    vatNumber: `${20000000000 + i}`,
                    phoneNumber: `3${String(i + 10).padStart(9, '0')}`, // Start from 3000000010 to avoid conflict with previous 0-5 seed
                    address: {
                        streetAddress: `${r.cuisine} Street ${i}`,
                        city: r.city,
                        province: 'NY', // Mock province
                        zipCode: r.zip
                    },
                    menu: []
                });
                await restaurant.save();
                console.log(`Created Restaurant: ${r.name} (${r.zip})`);
            }

            // Create Full Menu if empty
            if (restaurant.menu.length === 0) {
                const categories = ['Starter', 'Main', 'Dessert', 'Drink'];
                for (const cat of categories) {
                    for (let j = 1; j <= 3; j++) { // 3 items per category
                        const dishName = `${r.cuisine} ${cat} ${j}`;
                        const dishPrice = 500 + (j * 200); // Calculate price

                        let dish = await Dish.create({
                            name: dishName,
                            description: `Delicious ${cat} from ${r.cuisine} tradition.`,
                            // price: dishPrice, // Removed as not in Schema
                            ingredients: ['Love', 'Secrets', 'Flavor'],
                            category: cat,
                            restaurant: restaurant._id,
                            image: '/images/default-dish.png'
                        });

                        restaurant.menu.push({
                            dish: dish._id,
                            price: dishPrice, // Use variable
                            preparationTime: 10 + (j * 5)
                        });
                    }
                }
                await restaurant.save();
                console.log(`Populated Menu for ${r.name}`);
            }
        }

        // 2. Seed Customers
        for (const c of customers) {
            let user = await User.findOne({ username: c.username });
            if (!user) {
                user = await User.create({
                    username: c.username,
                    email: `${c.username}@seed.com`,
                    password: 'Pass123!',
                    confirmPassword: 'Pass123!',
                    firstName: c.first,
                    lastName: c.last,
                    type: 'customer'
                });
                console.log(`Created User: ${c.username}`);
            }

            // Create/Update CustomerData (Profile/Address)
            let custData = await CustomerData.findOne({ user: user._id });
            if (!custData) {
                custData = await CustomerData.create({
                    user: user._id,
                    address: {
                        streetAddress: '123 Test St',
                        city: c.city,
                        province: 'NY',
                        zipCode: c.zip
                    },
                    cards: [{
                        cardOwner: `${c.first} ${c.last}`,
                        cardNumber: '1111222233334444', // Will be masked or stored as is depending on backend logic? Schema says: match: [/^(\*{12}\d{4}|\d{16})$/, 'Invalid number.']
                        // Let's store full number, backend or schema might mask it? 
                        // Wait, schema validator allows 16 digits.
                        expiryDate: '12/30'
                    }]
                });
                console.log(`Created Profile for ${c.username} (Zip: ${c.zip})`);
            }
        }

        console.log('--- Seeding Complete ---');
        console.log('Test Accounts:');
        console.log('Hub 1 (10001): cust_10001 / Pass123!');
        console.log('Hub 2 (20002): cust_20002 / Pass123!');
        console.log('Owner Ex: owner_pastaparadise / Pass123!');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
