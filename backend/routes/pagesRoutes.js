/**
 * Page Routes
 * 
 * Serves HTML pages for authenticated and public routes.
 * Routes users to appropriate pages based on auth state and user type.
 */

import express from 'express';
import path from 'path';
import authMiddleware from '../middleware/auth.js';
import setupCheckMiddleware from "../middleware/setupCheck.js";
import onlyOwners from "../middleware/onlyOwners.js";
import onlyCustomers from "../middleware/onlyCustomers.js";

const router = express.Router();
const __dirname = path.resolve();

router.get('/home', authMiddleware, setupCheckMiddleware, (req, res) => {
    if (req.user.type === 'customer') res.sendFile(path.join(__dirname, 'frontend/html/homeCustomer.html'));
    else res.sendFile(path.join(__dirname, 'frontend/html/homeOwner.html'));
})

router.get('/profile', authMiddleware, setupCheckMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/profile.html'));
})

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/login.html'));
});

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/register.html'));
});

router.get('/finalize', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/finalize.html'));
})

router.get('/restaurant/add', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/addRestaurant.html'));
})

router.get('/menu/manager', authMiddleware, setupCheckMiddleware, onlyOwners, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/menuManager.html'));
})

router.get('/restaurant/analytics', authMiddleware, setupCheckMiddleware, onlyOwners, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/analytics.html'));
})

router.get('/restaurant/:id', authMiddleware, setupCheckMiddleware, onlyCustomers, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/restaurantPage.html'));
})

router.get('/cart', authMiddleware, setupCheckMiddleware, onlyCustomers, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/cart.html'));
})

router.get('/checkout', authMiddleware, setupCheckMiddleware, onlyCustomers, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/checkout.html'));
})

router.get('/profile/edit', authMiddleware, setupCheckMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/editProfile.html'));
})

export default router;