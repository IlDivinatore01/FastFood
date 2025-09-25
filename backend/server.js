/**
 * Main server application entry point for the FastFood delivery platform.
 * 
 * This file configures and initializes the Express.js server with all necessary middleware,
 * security features, routing, and database connections. It handles:
 * - Database connection initialization
 * - Security middleware (Helmet, CORS, rate limiting)
 * - Static file serving for frontend assets
 * - API documentation with Swagger UI
 * - Global error handling for validation and database errors
 * - Authentication rate limiting for security
 * 
 * The server supports both customer and restaurant owner user types with
 * comprehensive authentication and authorization features.
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import pagesRoutes from './routes/pagesRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import helmet from 'helmet';

dotenv.config();

const app = express();

const startServer = async () => {
    try {
        await connectDB();

        const __dirname = path.resolve();

        app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                        "img-src": ["'self'", "data:", "https://www.themealdb.com"],
                        "connect-src": ["'self'"],
                    },
                },
            })
        );

        app.use(express.json());
        app.use(cookieParser());
        app.use(cors());

        app.use(express.static(path.join(__dirname, 'frontend/public')));
        app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
        app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
        app.use('/images', express.static(path.join(__dirname, 'frontend/public/images')));
        app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, 
            max: 100, 
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
        });

        app.get('/', (req, res) => {
            if (req.cookies.token) {
                res.redirect('/home');
            } else {
                res.sendFile(path.join(__dirname, 'frontend/public/login.html'));
            }
        });

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        app.use('/auth', authLimiter, authRoutes); 
        app.use('/', pagesRoutes); 
        app.use('/api', apiRoutes); 

        app.use((err, req, res, next) => {
            if (process.env.NODE_ENV !== 'test') {
                console.error(err);
            }

            if (err.name === 'ValidationError') {
                const messages = Object.values(err.errors).map(e => e.message);
                return res.status(400).json({ error: messages });
            }

            if (err.code === 11000) {
                const field = Object.keys(err.keyPattern)[0];
                let message = `The ${field} is already in use.`;
                if (field === 'owner') message = 'User already has a restaurant.';
                return res.status(409).json({ error: message });
            }

            res.status(500).json({ error: 'Server Error' });
        });

        return app;

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

const server = await startServer().then(app => {
    const PORT = process.env.PORT || 5000;
    const runningServer = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    process.on('unhandledRejection', (err, promise) => {
        console.log(`Error: ${err.message}`);
        runningServer.close(() => process.exit(1));
    });

    return runningServer;
});

export default server;