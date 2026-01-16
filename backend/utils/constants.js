/**
 * Application Constants
 * 
 * User types, order states, and pagination defaults.
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