/**
 * Input Sanitization Middleware
 * 
 * Protects against NoSQL injection by removing keys starting with '$'.
 * Sanitizes string values against XSS attacks using the xss library.
 * Applied to req.body, req.params, and req.query.
 */

import xss from 'xss';

const sanitizeObject = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else {
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

    if (req.query) {
        for (const key in req.query) {
            req.query[key] = sanitizeObject(req.query[key]);
        }
    }

    next();
};

export default sanitizeMiddleware;
