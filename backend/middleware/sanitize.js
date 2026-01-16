/**
 * Middleware to sanitize inputs against NoSQL injection and XSS attacks.
 * Removes keys starting with '$' or containing '.' (if needed) from req.body, req.query, and req.params.
 * Sanitizes string values to prevent XSS.
 */
import xss from 'xss';

const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    } else if (typeof obj === 'string') {
        // XSS sanitization for strings, but we can't replace primitives in-place in JS.
        // This function needs to return the sanitized value if it's a primitive.
        return xss(obj);
    }
    return obj;
};

const sanitizeObject = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else {
                // Recursively sanitize and update the value
                obj[key] = sanitizeObject(obj[key]);
            }
        }
    } else if (typeof obj === 'string') {
        return xss(obj);
    }
    return obj;
};

const sanitizeMiddleware = (req, res, next) => {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.params) req.params = sanitizeObject(req.params);

    // req.query is a getter in Express 5, so we modify its properties in place.
    // We cannot do req.query = sanitizeObject(req.query).
    if (req.query) {
        for (const key in req.query) {
            req.query[key] = sanitizeObject(req.query[key]);
        }
    }

    next();
};

export default sanitizeMiddleware;
