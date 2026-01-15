/**
 * Order finalization and payment processing interface.
 * 
 * This module manages the checkout process with:
 * - Customer information validation and confirmation
 * - Delivery address and contact information management
 * - Payment method selection and processing
 * - Order review and final confirmation
 * - Payment security and validation handling
 * - Order submission and confirmation messaging
 * - Error handling for payment failures
 * 
 * Completes the customer ordering workflow with secure payment processing.
 */

import { fetchApi } from './api.js';
import { addMessage } from './errorManager.js';
import { createCard } from './components.js';

const cardResults = document.getElementById('cards');
const total = document.getElementById('total');
let order;
let price;
let paymentMethods;
let selectedCard;

window.onload = async () => {
    order = JSON.parse(localStorage.getItem('cart'));
    price = await getTotal();
    if (price !== null && price !== undefined) {
        total.innerText = (price / 100).toFixed(2) + '€';
    }
    paymentMethods = await getPayments();
    console.log('Payment methods:', paymentMethods);
    if (paymentMethods && paymentMethods.length > 0) {
        printCards(paymentMethods, cardResults);
    } else {
        document.getElementById('no-cards-message').hidden = false;
        document.getElementById('confirm-order-btn').disabled = true;
    }
    document.getElementById('confirm-order-btn').addEventListener('click', confirmOrder);
}

async function getTotal() {
    const menus = await getMenus(order);
    if (!menus) return 0;

    let totalPrice = 0;
    for (const key in order) {
        const orderItem = order[key];
        const restaurantId = orderItem.restaurant;

        if (menus[restaurantId]?.menu) {
            const menuItem = menus[restaurantId].menu.find((dish) => dish.id === orderItem.dish);
            if (menuItem) {
                totalPrice += menuItem.price * orderItem.amount;
            }
        }
    }
    return totalPrice;
}

async function getPayments() {
    const data = await fetchApi('/api/cards');
    return data || null;
}

function makePaymentCards(cards) {
    return cards.map(card => {
        const maskedNumber = '•••• •••• •••• ' + card.cardNumber.slice(-4);

        const col = document.createElement('div');
        col.className = 'col-md-6';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100 cursor-pointer payment-card border-2'; // Custom class for css or just logic
        cardDiv.style.cursor = 'pointer';
        cardDiv.style.transition = 'all 0.2s';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex align-items-center gap-3';

        const icon = document.createElement('img');
        icon.src = '/images/card.png';
        icon.style.width = '40px';
        icon.style.height = '40px';
        icon.style.objectFit = 'contain';

        const details = document.createElement('div');
        const numberEl = document.createElement('div');
        numberEl.className = 'fw-bold text-dark';
        numberEl.innerText = maskedNumber;

        const expiry = document.createElement('div');
        expiry.className = 'small text-muted';
        expiry.innerText = `Exp: ${card.expiryDate}`;

        details.append(numberEl, expiry);
        cardBody.append(icon, details);
        cardDiv.append(cardBody);

        // Selection Logic
        cardDiv.onclick = () => {
            // Remove active class from all
            document.querySelectorAll('.payment-card').forEach(c => {
                c.classList.remove('border-primary', 'bg-primary-subtle');
            });
            // Add to current
            cardDiv.classList.add('border-primary', 'bg-primary-subtle');
            selectedCard = card;
        };

        col.append(cardDiv);
        return col;
    });
}

function printCards(cards, container) {
    container.innerHTML = '';
    if (!cards || cards.length === 0) {
        document.getElementById('no-cards-message').removeAttribute('hidden');
    } else {
        document.getElementById('no-cards-message').setAttribute('hidden', 'true');
        const paymentCards = makePaymentCards(cards);
        paymentCards.forEach(card => container.appendChild(card));
    }
}

async function confirmOrder() {
    if (!selectedCard) {
        addMessage('Please select a payment method.');
        return;
    }

    const menus = await getMenus(order);
    if (!menus) {
        addMessage('Could not retrieve menu information to place order. Please try again.');
        return;
    }

    const orderPayload = {};
    for (const key in order) {
        const orderItem = order[key];
        const restaurantId = orderItem.restaurant;
        const dishId = orderItem.dish;

        if (menus[restaurantId]?.menu) {
            const menuItem = menus[restaurantId].menu.find(d => d.id === dishId);
            if (menuItem) {
                orderPayload[key] = {
                    ...orderItem,
                    price: menuItem.price * orderItem.amount
                };
            }
        }
    }

    if (Object.keys(orderPayload).length === 0) {
        addMessage('There are no valid items in your cart to order.');
        return;
    }

    const data = await fetchApi(`/api/order`, {
        method: 'POST',
        body: JSON.stringify(orderPayload),
    });

    if (data) {
        localStorage.removeItem('cart');
        addMessage('Order placed successfully!', false);
        setTimeout(() => { window.location.href = '/profile'; }, 1500);
    }
}

async function getMenus(order) {
    if (!order) return null;

    const restaurantIds = [...new Set(Object.values(order).map(item => item.restaurant))].filter(id => id);

    const menus = {};
    const promises = restaurantIds.map(id =>
        fetchApi(`/api/menu/${id}`).then(data => {
            if (data) {
                menus[id] = {
                    name: data.name,
                    menu: data.menu.map(dish => ({
                        id: dish.dish._id,
                        name: dish.dish.name,
                        image: dish.dish.image,
                        price: dish.price
                    }))
                };
            }
        })
    );

    await Promise.all(promises);
    return menus;
}