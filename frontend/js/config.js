/**
 * Frontend configuration module.
 * 
 * Centralizes configuration values that may change between environments.
 * This allows easy switching between development and production setups.
 */

export const config = Object.freeze({
    // API base URL - empty string means same origin (default)
    // For development with separate frontend/backend, set to: 'http://localhost:3000'
    // For production, this should typically remain empty or match your domain
    API_BASE_URL: '',
});
