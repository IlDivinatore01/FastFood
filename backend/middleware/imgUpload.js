/**
 * Image Upload Middleware
 * 
 * Configures Multer for handling image file uploads.
 * Saves files to /images/uploads/ (persistent volume in production).
 * Validates file types (jpeg, jpg, png, webp, gif) and enforces 5MB size limit.
 * Sanitizes filenames to prevent security issues.
 */

import multer from 'multer';
import path from 'path';

const __dirname = path.resolve();

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, __dirname + `/frontend/public/images/uploads`);
    },
    filename: (req, file, callback) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 50);
        const name = `${Date.now()}-${baseName}${ext}`;
        callback(null, name);
    }
});

const imgUpload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        if (!file) {
            return cb(null, true);
        }

        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, webp, gif)'));
    }
});

export function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected file field.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
}

export default imgUpload;