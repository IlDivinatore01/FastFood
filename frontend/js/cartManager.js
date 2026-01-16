/**
 * Cart Manager Module
 * 
 * Manages shopping cart state in localStorage.
 * Handles adding/removing items, enforces single-restaurant cart rule.
 * Cart keys use format: "restaurantId:dishId".
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

    const existingRestaurants = [...new Set(Object.values(cart).map(i => i.restaurant))];
    if (existingRestaurants.length > 0 && !existingRestaurants.includes(restaurantId)) {
        const confirmed = confirm(
            'Your cart contains items from another restaurant. ' +
            'Do you want to clear the cart and add this item?'
        );
        if (!confirmed) {
            return false;
        }
        localStorage.removeItem('cart');
    }

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