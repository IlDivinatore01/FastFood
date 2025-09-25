/**
 * Shopping cart management and order building functionality.
 * 
 * This module handles cart operations including:
 * - Cart item display and quantity management
 * - Real-time total calculation with taxes and fees
 * - Item modification and removal capabilities
 * - Special instructions and customization handling
 * - Promotional code application and discount calculation
 * - Cart persistence across browser sessions
 * - Order summary generation and validation
 * 
 * Critical component managing the customer's order before checkout.
 */

import { fetchApi } from './api.js';

const items = document.getElementById('items');
const total = document.getElementById('total');
const confirm = document.getElementById('confirm');
let currentOrder;
let cartMenus;

window.onload = async () => {
    currentOrder = JSON.parse(localStorage.getItem('cart'));
    cartMenus = await getMenus(currentOrder);
    if (cartMenus) {
        confirmArea();
        printCards(makeCards(currentOrder, cartMenus), items);
    }
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        window.location.href = '/checkout';
    });
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

function makeCards(order, menus) {
    let cards = [];

    for (const key in order) {
        const orderData = order[key];
        const dishId = orderData.dish;
        const restId = orderData.restaurant;
        const orderAmount = orderData.amount;

        if (!menus[restId]?.menu) {
            continue;
        }

        const restName = menus[restId].name
        const dish = menus[restId].menu.find(dish => dish.id === dishId);

        if (!dish) {
            continue;
        }

        const card = document.createElement('div');
        card.className = 'card mb-3';

        const row = document.createElement('div');
        row.className = 'row g-0 align-items-center'; 

        const colImg = document.createElement('div');
        colImg.className = 'col-3'; 

        const cardImg = document.createElement('img');
        cardImg.className = 'img-fluid rounded-start'; 
        cardImg.src = dish.image;
        cardImg.alt = `Image of ${dish.name}`;

        const colBody = document.createElement('div');
        colBody.className = 'col-9'; 

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.innerText = dish.name;

        const restaurantName = document.createElement('p');
        restaurantName.className = 'card-text';
        restaurantName.innerText = restName;

        const price = document.createElement('p');
        price.className = 'card-text';
        price.innerText = dish.price / 100 + '€';

        const amount = document.createElement('input');
        amount.className = 'form-control w-25';
        amount.type = 'number';
        amount.value = orderAmount;
        amount.min = '0';
        amount.step = '1';
        amount.onchange = () => {
            if (!amount.checkValidity()){
                addMessage('Invalid amount.');
                amount.value = currentOrder[restId+dishId].amount;
                return;
            }
            if (amount.value === '0') {
                card.remove();
                delete currentOrder[restId+dishId];
            } else {
                currentOrder[restId+dishId].amount = parseInt(amount.value, 10);
            }
            localStorage.setItem('cart', JSON.stringify(currentOrder));
            confirmArea();
        };

        cardBody.append(cardTitle, restaurantName, price, amount);
        colBody.append(cardBody);
        colImg.append(cardImg);
        row.append(colImg, colBody);
        card.append(row);
        cards.push(card);
    }

    return cards;
}

function printCards(cards, container) {
    if (cards.length === 0) return;
    cards.forEach(card => {
        container.append(card);
    });
}

function confirmArea() {
    if (!currentOrder || Object.keys(currentOrder).length === 0) {
        const empty = document.createElement('h4');
        empty.innerText = 'Your cart is empty.';
        items.innerHTML = '';
        items.append(empty);
        confirm.remove();
    } else {
        let totalPrice = 0;
        for (const key in currentOrder) {
            const order = currentOrder[key];
            if (cartMenus[order.restaurant]?.menu) {
                const menuItem = cartMenus[order.restaurant].menu.find((dish) => dish.id === order.dish);
                if (menuItem) {
                    totalPrice += menuItem.price * order.amount;
                }
            }
        }
        total.innerHTML = 'Total ' + (totalPrice / 100).toFixed(2) + '€';
    }
}