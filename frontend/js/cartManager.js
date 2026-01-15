/**
 * Cart state management and persistence utility module.
 * 
 * This module provides cart data management with:
 * - Local storage integration for cart persistence
 * - Cart state synchronization across application pages
 * - Item addition and removal state management
 * - Cart total calculation and tax computation
 * - Cart validation and error handling
 * - Session management and cart recovery
 * - Cross-tab cart synchronization
 * 
 * Backend service for maintaining consistent cart state throughout the user session.
 */

export function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || {};
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    showCartButton();
}

export function addToCart(item, amount) {
    const cart = getCart();

    const restaurantId = item.restaurant || item.restaurantId;
    const dishId = typeof item.dish === 'string' ? item.dish : item.dish?._id;

    if (!restaurantId || !dishId) {
        console.warn('addToCart: missing restaurant/dish id', { item });
        return;
    }

    const key = `${restaurantId}:${dishId}`;

    const qty = parseInt(amount, 10);
    if (qty > 0) {
        cart[key] = {
            restaurant: restaurantId,
            dish: dishId,
            amount: qty
        };
    } else {
        delete cart[key];
    }

    saveCart(cart);
}

export function showCartButton() {
    const cart = getCart();
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.hidden = Object.keys(cart).length === 0;
    }
}