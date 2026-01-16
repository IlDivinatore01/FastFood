/**
 * Customer-specific data model for enhanced customer profiles.
 * 
 * This model extends user data with customer-specific information:
 * - Delivery preferences and default addresses
 * - Payment method preferences and history
 * - Order history and favorite items
 * - Dietary preferences and restrictions
 * - Loyalty program information and points
 * - Customer feedback and rating history
 * 
 * Enables personalized customer experience and order customization.
 */

import mongoose from 'mongoose';

const CustomerDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    address: {
        streetAddress: { type: String, required: true, minLength: 5, maxLength: 100 },
        city: { type: String, required: true, minLength: 2, maxLength: 100 },
        province: { type: String, required: true, uppercase: true, match: [/^[A-Z]{2}$/, 'Province must be a 2-letter code'] },
        zipCode: { type: String, required: true, match: [/^\d{5}$/, 'ZIP code must be 5 digits'] },
    },
    cards: [
        {
            cardOwner: {
                type: String,
                required: true,
                minLength: 3,
                maxLength: 100
            },
            cardNumber: {
                type: String,
                required: true,
                // Accept both full 16-digit (for validation before masking) and masked format
                match: [/^(\*{12}\d{4}|\d{16})$/, 'Invalid number.'],
            },
            expiryDate: {
                type: String,
                required: true,
                match: [/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry date.']
            }
            // NOTE: CVC is intentionally NOT stored - it's only used for payment validation
        }
    ]
});

const CustomerData = mongoose.model('CustomerData', CustomerDataSchema);
export default CustomerData;