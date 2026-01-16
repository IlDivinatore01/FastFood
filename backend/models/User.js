/**
 * User Model
 * 
 * Mongoose schema for user accounts (customers and restaurant owners).
 * Includes username/email/password with validation, profile image, and type.
 * Password is hashed with bcrypt before saving.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { USER_TYPES } from '../utils/constants.js';

const usernameRegex = /^\w{1,20}$/;
const nameRegex = /^[A-Za-zÀ-ÿ''.\-\s]{1,50}$/u;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_+={}|\\;:"<>?,./]).{8,32}$/;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minLength: 3,
        maxLength: 20,
        match: [usernameRegex, 'Username must be 3-20 characters long, must contain only letters, numbers and underscores.']
    },
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50,
        match: [nameRegex, 'First name must be 3-50 characters long and contain only letters, spaces, apostrophes, or hyphens.']
    },
    image: {
        type: String,
        default: '/images/default-profile.png'
    },
    lastName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50,
        match: [nameRegex, 'The last name must be 3-50 characters long, must contain only letters, apostrophes, dots, dashes and spaces..']
    },
    email: {
        type: String,
        required: function () { return this.active === true },
        unique: true,
        sparse: true,
        maxLength: 100,
        match: [emailRegex, 'Invalid email address.']
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 100,
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(USER_TYPES)
    },
    active: {
        type: Boolean,
        default: true
    }
})

userSchema.virtual('confirmPassword')
    .get(function () {
        return this._confirmPassword;
    })
    .set(function (value) {
        this._confirmPassword = value;
    });

userSchema.pre('validate', function (next) {
    if (this.isNew && this.password !== this.confirmPassword) {
        this.invalidate('confirmPassword', 'The passwords don\'t match.');
    }
    next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    if (!passwordRegex.test(this.password)) {
        return next(new Error('The password must be 8-32 characters long, must contain at least a lower case letter, an uppercase letter, a number and a special character.'));
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);
export default User;