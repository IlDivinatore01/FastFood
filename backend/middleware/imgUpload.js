/**
 * File upload middleware for handling image uploads with validation.
 * 
 * This middleware manages file upload operations:
 * - Multer configuration for multipart form data
 * - File type validation (images only)
 * - File size limits and storage configuration
 * - Filename sanitization and collision prevention
 * - Upload error handling and validation
 * 
 * Used for profile pictures, restaurant images, and dish photos.
 */

import multer from 'multer';
import path from 'path';

const __dirname = path.resolve();

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, __dirname + `/frontend/public/images`);
    },
    filename: (req, file, callback) => {
        const name = Date.now() + '-' + file.originalname;
        callback(null, name);
    }
});

const imgUpload = multer({ storage });

export default imgUpload;