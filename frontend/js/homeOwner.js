/**
 * Restaurant owner dashboard and business overview interface.
 * 
 * This module provides owner dashboard functionality including:
 * - Business performance metrics and key statistics
 * - Recent order notifications and management shortcuts
 * - Quick access to restaurant management tools
 * - Revenue summaries and sales overview
 * - Menu management and restaurant settings navigation
 * - Order fulfillment status tracking
 * - Business insights and recommended actions
 * 
 * Central command center for restaurant owners to monitor and manage their business.
 */

import { fetchApi } from './api.js';
import { createCard } from './components.js';

const queueElement = document.getElementById('queue');
let currentQueue;

window.onload = async () => {
    const queue = await getQueue();
    currentQueue = queue;
    showCards(orderCards(queue), queueElement);
}

async function getQueue() {
    const data = await fetchApi('/api/queue');
    return data ? data.queue : [];
}

function orderCards(orders) {
    return orders.map(order => {
        const customerName = (order.customer?.name || 'N/A');
        const bodyText = `Customer: ${customerName}\nAmount: ${order.amount}`;

        const cardCol = createCard({
            imageSrc: order.dish.image,
            title: order.dish.name,
            bodyText: bodyText,
            colClass: 'col-12 col-md-6 col-lg-4 col-xl-3'
        });

        const cardBody = cardCol.querySelector('.card-body');
        const status = document.createElement('p');
        status.className = 'card-text fw-bold';
        status.innerText = `Status: ${order.state}`;
        cardBody.appendChild(status);

        if (order.state === 'received' || order.state === 'preparing') {
            const advanceBtn = document.createElement('button');
            advanceBtn.className = 'btn btn-secondary mt-auto';
            advanceBtn.innerText = order.state === 'received' ? 'Start Preparing' : 'Mark as Ready';
            advanceBtn.onclick = (e) => {
                e.stopPropagation();
                advanceOrder(order._id);
            };
            cardBody.appendChild(advanceBtn);
        }

        return cardCol;
    });
}

function showCards(cards, container) {
    container.innerHTML = '';

    if (cards.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'col-12';
        empty.innerText = 'Your queue is currently empty.';

        container.append(empty);
        return;
    }

    cards.forEach((card) => { container.append(card) });
}

async function confirmPickup(orderId) {
    const data = await fetchApi('/api/order/confirm-pickup', {
        method: 'PUT',
        body: JSON.stringify({ orderId }),
    });

    return data?.success;
}

async function advanceOrder(orderId) {
    const data = await fetchApi('/api/order/update', {
        method: 'PUT',
        body: JSON.stringify({ orderId }),
    });

    if (data) {
        const orderIndex = currentQueue.findIndex(o => o._id === orderId);
        if (orderIndex !== -1) {
            const order = currentQueue[orderIndex];
            if (order.state === 'received') {
                order.state = 'preparing';
            } else if (order.state === 'preparing') {
                currentQueue.splice(orderIndex, 1);
            }
        }
        showCards(orderCards(currentQueue), queueElement);
    }
}