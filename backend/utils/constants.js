/**
 * Application constants and configuration values.
 * 
 * This module defines global constants used throughout the application:
 * - User type enumerations (CUSTOMER, OWNER)
 * - Order status constants and state definitions
 * - Validation patterns and limits
 * - Error message templates
 * - Application configuration defaults
 * 
 * Centralizes constant definitions for consistent usage across the application.
 */

export const USER_TYPES = Object.freeze({
    CUSTOMER: 'customer',
    OWNER: 'owner',
});

export const ORDER_STATES = Object.freeze({
    RECEIVED: 'received',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed',
});

export const PAGINATION = Object.freeze({
    DEFAULT_LIMIT: 10,
    SEARCH_LIMIT: 20,
});