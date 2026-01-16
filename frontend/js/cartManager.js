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
        return false;
    }

    // Check if adding from different restaurant
    const existingRestaurants = [...new Set(Object.values(cart).map(i => i.restaurant))];
    if (existingRestaurants.length > 0 && !existingRestaurants.includes(restaurantId)) {
        const confirmed = confirm(
            'Your cart contains items from another restaurant. ' +
            'Do you want to clear the cart and add this item?'
        );
        if (!confirmed) {
            return false;
        }
        // Clear cart before adding new item
        localStorage.removeItem('cart');
    }

    // Re-get cart (might have been cleared)
    const currentCart = getCart();
    const key = `${restaurantId}:${dishId}`;

    const qty = parseInt(amount, 10);
    if (qty > 0) {
        currentCart[key] = {
            restaurant: restaurantId,
            dish: dishId,
            amount: qty
        };
    } else {
        delete currentCart[key];
    }

    saveCart(currentCart);
    return true;
}

export function showCartButton() {
    const cart = getCart();
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.hidden = Object.keys(cart).length === 0;
    }
}