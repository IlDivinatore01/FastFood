
import request from 'supertest';
import express from 'express';
import compression from 'compression';

const app = express();
app.use(compression());

app.get('/test-compression', (req, res) => {
    const hugeResponse = 'a'.repeat(100000); // Large content to trigger compression
    res.send(hugeResponse);
});

describe('Optimization Tests', () => {
    it('should compress responses with gzip', async () => {
        const res = await request(app)
            .get('/test-compression')
            .set('Accept-Encoding', 'gzip');

        expect(res.headers['content-encoding']).toBe('gzip');
        expect(res.status).toBe(200);
    });
});
