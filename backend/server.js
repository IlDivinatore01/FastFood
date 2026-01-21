/**
 * Server Entry Point
 * 
 * Express server with security middleware, routing, and MongoDB connection.
 * Serves API endpoints and static frontend files.
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import pagesRoutes from './routes/pagesRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import sanitizeMiddleware from './middleware/sanitize.js';
import compression from 'compression';
import morgan from 'morgan';

import { importMeals } from './utils/mealsImporter.js';

dotenv.config();

const app = express();

app.set('trust proxy', 2);

const startServer = async () => {
    try {
        await connectDB();
        await importMeals();

        const __dirname = path.resolve();

        app.use(compression());

        if (process.env.NODE_ENV === 'development') {
            app.use(morgan('dev'));
        } else {
            app.use(morgan('combined'));
        }

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

        app.use((req, res, next) => {
            if (req.body) {
                req.body = mongoSanitize.sanitize(req.body);
            }
            next();
        });

        app.use(hpp());

        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : [
                'http://localhost:5000',
                'http://127.0.0.1:5000',
                'http://localhost:3000'
            ];

        if (process.env.ALLOWED_ORIGINS) {
            const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
            allowedOrigins.push(...envOrigins.map(origin => origin.trim()));
        }

        app.use(cors({
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                if (allowedOrigins.indexOf(origin) === -1) {
                    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                    return callback(new Error(msg), false);
                }
                return callback(null, true);
            },
            credentials: true
        }));

        app.use(sanitizeMiddleware);

        app.get('/', (req, res) => {
            if (req.cookies.token) {
                res.redirect('/home');
            } else {
                res.sendFile(path.join(__dirname, 'frontend/public/landing.html'));
            }
        });

        app.use(express.static(path.join(__dirname, 'frontend/public')));
        app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
        app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
        app.use('/images', express.static(path.join(__dirname, 'frontend/public/images')));
        app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: process.env.NODE_ENV === 'production' ? 20 : 100,
            message: { error: 'Too many attempts, please try again later.' }
        });

        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 200,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
        });

        // Swagger UI with credentials support for cookie-based auth
        const swaggerOptions = {
            swaggerOptions: {
                withCredentials: true,
                requestInterceptor: (req) => {
                    req.credentials = 'include';
                    return req;
                }
            }
        };
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

        app.use('/auth', authLimiter, authRoutes);
        app.use('/', pagesRoutes);
        app.use('/api', apiLimiter, apiRoutes);

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

            if (err.statusCode) {
                return res.status(err.statusCode).json({ error: err.message });
            }

            if (err.name === 'MulterError') {
                return res.status(400).json({ error: err.message });
            }

            if (err.message && err.message.includes('password') ||
                err.message && err.message.includes('Password')) {
                return res.status(400).json({ error: err.message });
            }

            res.status(500).json({ error: 'Server Error' });
        });

        return app;

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

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