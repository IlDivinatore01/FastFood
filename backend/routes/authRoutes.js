/**
 * Auth Routes
 * 
 * Authentication endpoints: register, login, logout, check.
 * Includes image upload for profile pictures during registration.
 */

import express from 'express';
import { registerUser, loginUser, logoutUser, checkLogin } from '../controllers/authController.js';
import imgUpload from '../middleware/imgUpload.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Registers a new user (customer or owner).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [username, firstName, lastName, email, password, confirmPassword, type]
 *             properties:
 *               username: { type: string, example: "mariorossi" }
 *               firstName: { type: string, example: "Mario" }
 *               lastName: { type: string, example: "Rossi" }
 *               email: { type: string, example: "mario.rossi@gmail.com" }
 *               password: { type: string, example: "Secret_123" }
 *               confirmPassword: { type: string, example: "Secret_123" }
 *               type: { type: string, enum: [customer, owner], example: "customer" }
 *               image: { type: string, format: binary, description: "Profile picture" }
 *     responses:
 *       '201':
 *         description: User registered successfully.
 *       '400':
 *         description: Validation error.
 */
router.post('/register', imgUpload.single('image'), registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a user
 *     description: Logs in a user and sets an HttpOnly cookie with a JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: "mariorossi" }
 *               password: { type: string, example: "Secret_123" }
 *     responses:
 *       '200':
 *         description: Login successful.
 *       '400':
 *         description: Wrong password.
 *       '404':
 *         description: User not found.
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     tags: [Auth]
 *     summary: Log out a user
 *     description: Clears the authentication cookie.
 *     responses:
 *       '200':
 *         description: Logout successful.
 */
router.get('/logout', logoutUser);

/**
 * @swagger
 * /auth/check:
 *   get:
 *     tags: [Auth]
 *     summary: Check authentication status
 *     description: Checks if the user is logged in by verifying the token cookie.
 *     responses:
 *       '200':
 *         description: Returns the authentication status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 */
router.get('/check', checkLogin);

export default router;