
import request from 'supertest';
import express from 'express';
import imgUpload from '../middleware/imgUpload.js';
import sanitizeMiddleware from '../middleware/sanitize.js';
import path from 'path';
import { jest } from '@jest/globals';

// Mock DB connection
jest.unstable_mockModule('../config/db.js', () => ({
    default: jest.fn(),
}));

const app = express();
app.use(express.json());
// Add sanitize middleware
app.use(sanitizeMiddleware);

app.post('/upload', imgUpload.single('image'), (req, res) => {
    res.status(200).json({ message: 'Upload successful' });
});

app.post('/test-sanitize', (req, res) => {
    console.log('Sanitize Route Body:', req.body); // Debug log
    res.json(req.body);
});

// Error handling
app.use((err, req, res, next) => {
    console.log('Test App Error:', err.message); // Debug log
    if (err.message === 'Only images are allowed (jpeg, jpg, png, webp)') {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
});

describe('Security Tests', () => {

    describe('File Upload Security', () => {
        it('should reject non-image files', async () => {
            const buffer = Buffer.from('some text content');
            const res = await request(app)
                .post('/upload')
                .attach('image', buffer, 'text.txt');

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Only images are allowed (jpeg, jpg, png, webp)');
        });

        it('should accept image files', async () => {
            const buffer = Buffer.from('fake image content');
            const res = await request(app)
                .post('/upload')
                .attach('image', buffer, 'image.jpg');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Upload successful');
        });
    });

    describe('NoSQL Injection Security', () => {
        it('should sanitize input by removing $ keys', async () => {
            const payload = {
                username: { "$gt": "" },
                password: "password123"
            };

            const res = await request(app)
                .post('/test-sanitize')
                .send(payload);

            // mongoSanitize removes keys starting with $
            expect(res.body.username).toEqual({});
            expect(res.body.password).toBe('password123');
        });
    });
});
