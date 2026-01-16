/**
 * Main API routing module consolidating all business logic endpoints.
 * 
 * This comprehensive routing module organizes all API endpoints:
 * - User management and profile operations
 * - Restaurant CRUD operations and management
 * - Dish management and menu operations
 * - Order processing and status tracking
 * - File upload endpoints for images
 * - Search and filtering capabilities
 * 
 * Implements proper HTTP methods, middleware chains, and authorization
 * for all business logic operations.
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import onlyCustomers from '../middleware/onlyCustomers.js';
import onlyOwners from '../middleware/onlyOwners.js';
import finalizeSetupMiddleware from '../middleware/setupCheck.js';
import imgUpload from '../middleware/imgUpload.js';

import {
  getProfile,
  finalizeSetup,
  addCard,
  removeCard,
  getCards,
  deactivateAccount,
  editProfile,
  editAddress
} from '../controllers/userController.js';

import { addRestaurant, getNearby, getMenu, editMenu, editRestaurant, getAnalytics, searchRestaurants } from '../controllers/restaurantController.js';
import { getOrders, newOrder, confirmPickup, getQueue, advanceQueue, waitEstimation } from '../controllers/orderController.js';
import { getDishes, addDish, searchDishes } from '../controllers/dishController.js';

const router = express.Router();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     tags: [User & Profile]
 *     summary: Get user profile
 *     description: Returns the complete profile for the logged-in user, including customer or restaurant specific data.
 *     responses:
 *       '200':
 *         description: User profile data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile: { $ref: '#/components/schemas/User' }
 *                 address: { $ref: '#/components/schemas/Address' }
 *                 cards: { type: array, items: { $ref: '#/components/schemas/Card' } }
 *                 restaurant: { $ref: '#/components/schemas/Restaurant' }
 *       '404':
 *         description: User not found.
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get user's orders
 *     description: Retrieves a paginated list of orders for the logged-in user (customer or owner).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: The page number to retrieve.
 *     responses:
 *       '200':
 *         description: A list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 orders: { type: array, items: { $ref: '#/components/schemas/Order' } }
 */
router.get('/orders', authMiddleware, getOrders);

/**
 * @swagger
 * /api/nearby:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get nearby restaurants
 *     description: Returns restaurants with the same ZIP code as the logged-in customer.
 *     responses:
 *       '200':
 *         description: A list of nearby restaurants.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nearbyRestaurants: { type: array, items: { $ref: '#/components/schemas/Restaurant' } }
 */
router.get('/nearby', authMiddleware, onlyCustomers, getNearby);

/**
 * @swagger
 * /api/menu/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant menu
 *     description: Retrieves the full menu and details for a specific restaurant.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The restaurant ID.
 *     responses:
 *       '200':
 *         description: Restaurant menu and details.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Restaurant' }
 */
router.get('/menu/:id', authMiddleware, getMenu);

/**
 * @swagger
 * /api/dishes:
 *   get:
 *     tags: [Dishes]
 *     summary: Get available dishes for a restaurant
 *     description: Retrieves a paginated list of dishes that a restaurant owner can add to their menu.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Search term for dish name or category.
 *       - in: query
 *         name: restaurant
 *         required: true
 *         schema: { type: string }
 *         description: The restaurant ID.
 *     responses:
 *       '200':
 *         description: A list of dishes.
 */
router.get('/dishes', authMiddleware, onlyOwners, getDishes);

/**
 * @swagger
 * /api/cards:
 *   get:
 *     tags: [User & Profile]
 *     summary: Get customer's payment cards
 *     description: Retrieves the payment cards for the logged-in customer, with card numbers censored.
 *     responses:
 *       '200':
 *         description: A list of censored cards.
 */
router.get('/cards', authMiddleware, onlyCustomers, getCards);

/**
 * @swagger
 * /api/queue:
 *   get:
 *     tags: [Orders]
 *     summary: Get the order queue for a restaurant
 *     description: Retrieves the current order queue for the logged-in restaurant owner.
 *     responses:
 *       '200':
 *         description: The list of orders in the queue.
 */
router.get('/queue', authMiddleware, onlyOwners, getQueue);

/**
 * @swagger
 * /api/estimate/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order wait time estimate
 *     description: Calculates the estimated wait time for a specific order.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The order ID.
 *     responses:
 *       '200':
 *         description: The estimated completion time.
 */
router.get('/estimate/:id', authMiddleware, waitEstimation);

/**
 * @swagger
 * /api/restaurant/analytics:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant analytics
 *     description: Retrieves sales analytics for the logged-in owner's restaurant within a date range.
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string }
 *         description: Start date timestamp.
 *       - in: query
 *         name: end
 *         schema: { type: string }
 *         description: End date timestamp.
 *     responses:
 *       '200':
 *         description: Analytics data.
 */
router.get('/restaurant/analytics', authMiddleware, onlyOwners, getAnalytics);

/**
 * @swagger
 * /api/dishes/search:
 *   get:
 *     tags: [Dishes]
 *     summary: Search for dishes across all restaurants
 *     description: Allows customers to search for dishes by name, category, and max price.
 *     parameters:
 *       - { name: name, in: query, schema: { type: string }, description: "Dish name" }
 *       - { name: category, in: query, schema: { type: string }, description: "Dish category" }
 *       - { name: price, in: query, schema: { type: integer }, description: "Max price in cents" }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *     responses:
 *       '200':
 *         description: A list of dishes matching the criteria.
 */
router.get('/dishes/search', authMiddleware, onlyCustomers, searchDishes);

/**
 * @swagger
 * /api/restaurant/search:
 *   get:
 *     tags: [Restaurants]
 *     summary: Search for restaurants
 *     description: Allows customers to search for restaurants by name or location.
 *     parameters:
 *       - { name: name, in: query, schema: { type: string }, description: "Restaurant name" }
 *       - { name: street, in: query, schema: { type: string }, description: "Street address" }
 *       - { name: city, in: query, schema: { type: string }, description: "City" }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *     responses:
 *       '200':
 *         description: A list of restaurants matching the criteria.
 */
router.get('/restaurant/search', authMiddleware, onlyCustomers, searchRestaurants)

/**
 * @swagger
 * /api/finalize:
 *   post:
 *     tags: [User & Profile]
 *     summary: Finalize customer profile
 *     description: Adds the initial address and payment method for a new customer.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address: { $ref: '#/components/schemas/Address' }
 *               card: { $ref: '#/components/schemas/Card' }
 *     responses:
 *       '201':
 *         description: Profile finalized successfully.
 */
router.post('/finalize', authMiddleware, onlyCustomers, finalizeSetup);

/**
 * @swagger
 * /api/card/add:
 *   post:
 *     tags: [User & Profile]
 *     summary: Add a payment card
 *     description: Adds a new payment card to the customer's profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               card: { $ref: '#/components/schemas/Card' }
 *     responses:
 *       '201':
 *         description: Card added successfully.
 */
router.post('/card/add', authMiddleware, onlyCustomers, addCard);

/**
 * @swagger
 * /api/restaurant/add:
 *   post:
 *     tags: [Restaurants]
 *     summary: Add a new restaurant
 *     description: Finalizes an owner's profile by creating their restaurant.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               restaurant:
 *                 type: object
 *                 properties:
 *                   name: { type: string, example: "Da Mario" }
 *                   vatNumber: { type: string, example: "12345678901" }
 *                   phoneNumber: { type: string, example: "3450124321" }
 *                   address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       '201':
 *         description: Restaurant created successfully.
 */
router.post('/restaurant/add', authMiddleware, onlyOwners, imgUpload.single('image'), addRestaurant);

/**
 * @swagger
 * /api/dish/add:
 *   post:
 *     tags: [Dishes]
 *     summary: Add a new dish
 *     description: Creates a new dish associated with a specific restaurant.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               name: { type: string }
 *               category: { type: string }
 *               restaurant: { type: string }
 *               'ingredients[]': { type: array, items: { type: string } }
 *     responses:
 *       '201':
 *         description: Dish created successfully.
 */
router.post('/dish/add', authMiddleware, onlyOwners, imgUpload.single('image'), addDish);

/**
 * @swagger
 * /api/order:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     description: Creates one or more new orders from the customer's cart.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: "An object where each key is a composite ID and the value is the order details."
 *             example:
 *               "682f252b2bfba60237b8df61682f552b2bfba03617b8df41":
 *                 { restaurant: "682f252b2bfba60237b8df61", dish: "682f552b2bfba03617b8df41", amount: 3, price: 600 }
 *     responses:
 *       '201':
 *         description: Order received.
 */
router.post('/order', authMiddleware, onlyCustomers, newOrder);

/**
 * @swagger
 * /api/confirmpickup/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Confirm order pickup
 *     description: Marks an order with state 'ready' as 'completed'.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The order ID.
 *     responses:
 *       '200':
 *         description: Order completed.
 *       '404':
 *         description: Order not found or not ready.
 */
router.put('/confirmpickup/:id', authMiddleware, onlyCustomers, confirmPickup);

/**
 * @swagger
 * /api/order/update:
 *   put:
 *     tags: [Orders]
 *     summary: Advance order in queue
 *     description: Advances an order in the queue from 'received' to 'preparing', or 'preparing' to 'ready'. If no orderId is provided, it advances the head of the queue.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId: { type: string, description: "The ID of the specific order to advance." }
 *     responses:
 *       '200':
 *         description: Queue advanced successfully.
 */
router.put('/order/update', authMiddleware, onlyOwners, advanceQueue);

/**
 * @swagger
 * /api/menu/update:
 *   put:
 *     tags: [Restaurants]
 *     summary: Update a restaurant's menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurant: { type: string }
 *               newMenu: { type: array, items: { $ref: '#/components/schemas/MenuItem' } }
 *     responses:
 *       '200':
 *         description: Menu updated successfully.
 */
router.put('/menu/update', authMiddleware, onlyOwners, editMenu);

/**
 * @swagger
 * /api/address/update:
 *   put:
 *     tags: [User & Profile]
 *     summary: Update customer address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       '200':
 *         description: Address updated successfully.
 */
router.put('/address/update', authMiddleware, onlyCustomers, editAddress);

/**
 * @swagger
 * /api/profile/update:
 *   put:
 *     tags: [User & Profile]
 *     summary: Update user profile information
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               newProfile:
 *                 type: object
 *                 properties:
 *                   username: { type: string }
 *                   firstName: { type: string }
 *                   lastName: { type: string }
 *                   email: { type: string }
 *                   password: { type: string }
 *                   newPassword: { type: string }
 *                   confirmPassword: { type: string }
 *     responses:
 *       '200':
 *         description: Profile updated successfully.
 */
router.put('/profile/update', authMiddleware, imgUpload.single('image'), editProfile);

/**
 * @swagger
 * /api/restaurant/update:
 *   put:
 *     tags: [Restaurants]
 *     summary: Update restaurant information
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               newRestaurant: { $ref: '#/components/schemas/Restaurant' }
 *     responses:
 *       '200':
 *         description: Restaurant updated successfully.
 */
router.put('/restaurant/update', authMiddleware, imgUpload.single('image'), editRestaurant)

/**
 * @swagger
 * /api/deactivate:
 *   delete:
 *     tags: [User & Profile]
 *     summary: Deactivate user account
 *     description: Deactivates the user's account after password confirmation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       '200':
 *         description: Account deactivated.
 *       '400':
 *         description: Wrong password.
 */
router.delete('/deactivate', authMiddleware, deactivateAccount);

/**
 * @swagger
 * /api/card/delete/{id}:
 *   delete:
 *     tags: [User & Profile]
 *     summary: Delete a payment card
 *     description: Removes a payment card from the customer's profile.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The card ID to delete.
 *     responses:
 *       '200':
 *         description: Card removed successfully.
 */
router.delete('/card/delete/:id', authMiddleware, onlyCustomers, removeCard);

export default router;