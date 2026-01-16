/**
 * Restaurant Model
 * 
 * Mongoose schema for restaurant businesses.
 * Includes name, address, phone, VAT, owner reference, menu items with prices,
 * order queue for preparation tracking, and active status.
 */

import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 50,
    },
    image: {
        type: String,
        default: '/images/default-restaurant.png'
    },
    phoneNumber: {
        type: String,
        required: function () { return this.active === true },
        unique: true,
        sparse: true,
        match: [/^(\+39)?\d{9,11}$/, 'Invalid phone number.']
    },
    vatNumber: {
        type: String,
        required: function () { return this.active === true },
        unique: true,
        sparse: true,
        match: [/^\d{11}$/, 'VAT number must be exactly 11 digits']
    },
    address: {
        streetAddress: { type: String, required: true, minLength: 5, maxLength: 100 },
        city: { type: String, required: true, minLength: 2, maxLength: 100 },
        province: { type: String, required: true, uppercase: true, match: [/^[A-Z]{2}$/, 'Province must be a 2-letter uppercase code'] },
        zipCode: { type: String, required: true, match: [/^\d{5}$/, 'ZIP code must be 5 digits'] },
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    menu: [
        {
            dish: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Dish',
                required: true,
            },
            price: { type: Number, required: true, min: [1, 'Price must be greater then 0.'] },
            preparationTime: { type: Number, required: true, min: [1, 'Preparation time must be greater than 0.'] }
        }
    ],
    queue: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        }
    ],
    lastPreparationStart: {
        type: Date,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    }
})

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
export default Restaurant;