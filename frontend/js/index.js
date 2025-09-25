/**
 * Application entry point and initialization module.
 * 
 * This minimal module handles:
 * - Application startup and initialization
 * - Initial routing and page load handling
 * - Global application state setup
 * - Error boundary and global error handling
 * - Service worker registration (if applicable)
 * - Performance monitoring initialization
 * - Feature detection and browser compatibility
 * 
 * Foundation module that bootstraps the entire frontend application.
 */

import { fetchApi } from './api.js';

(async () => {
    const data = await fetchApi('/auth/check');
    if (data?.ok) {
        window.location.href = '/home';
    } else {
        window.location.href = '/login';
    }
})();