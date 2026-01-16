/**
 * Cart Page Script
 * 
 * Renders cart items, handles quantity changes and item removal.
 * Calculates total and navigates to checkout.
 */


import { fetchApi } from './api.js';
import { addMessage } from './errorManager.js';

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
        card.className = 'card mb-3 shadow-sm border-0'; // Premium look

        const row = document.createElement('div');
        row.className = 'row g-0 align-items-center p-2';

        const colImg = document.createElement('div');
        colImg.className = 'col-3 col-md-2';

        const cardImg = document.createElement('img');
        cardImg.className = 'img-fluid rounded';
        cardImg.src = dish.image;
        cardImg.alt = `Image of ${dish.name}`;
        cardImg.style.objectFit = 'cover';
        cardImg.style.height = '80px';
        cardImg.style.width = '100%';

        const colBody = document.createElement('div');
        colBody.className = 'col-9 col-md-10';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex justify-content-between align-items-center py-2';

        const infoDiv = document.createElement('div');

        const cardTitle = document.createElement('h6');
        cardTitle.className = 'card-title mb-1 fw-bold';
        cardTitle.innerText = dish.name;

        const restaurantName = document.createElement('p');
        restaurantName.className = 'card-text text-muted small mb-1';
        restaurantName.innerText = restName;

        const price = document.createElement('p');
        price.className = 'card-text fw-bold text-primary mb-0';
        price.innerText = (dish.price / 100).toFixed(2) + '€';

        infoDiv.append(cardTitle, restaurantName, price);

        const amountInput = document.createElement('div');
        amountInput.className = 'form-floating';

        const amount = document.createElement('input');
        amount.className = 'form-control';
        amount.style.width = '80px';
        amount.id = `amount-${key}`; // Unique ID for label
        amount.type = 'number';
        amount.value = orderAmount;
        amount.min = '0';
        amount.step = '1';
        amount.placeholder = 'Qty';

        const label = document.createElement('label');
        label.htmlFor = `amount-${key}`;
        label.innerText = 'Qty';

        amountInput.append(amount, label);

        amount.onchange = () => {
            if (!amount.checkValidity()) {
                addMessage('Invalid amount.');
                amount.value = currentOrder[key].amount;
                return;
            }
            if (amount.value === '0') {
                card.remove();
                delete currentOrder[key];
            } else {
                currentOrder[key].amount = parseInt(amount.value, 10);
            }
            localStorage.setItem('cart', JSON.stringify(currentOrder));
            confirmArea();
        };

        cardBody.append(infoDiv, amountInput);
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
        const empty = document.createElement('div');
        empty.className = 'text-center py-5';
        empty.innerHTML = `
            <div class="mb-3 display-1 text-muted"><i class="bi bi-cart-x"></i></div>
            <h4 class="text-secondary">Your cart is empty.</h4>
            <a href="/" class="btn btn-outline-primary mt-3">Start Ordering</a>
        `;
        items.innerHTML = '';
        items.append(empty);


        if (confirm) confirm.hidden = true;
    } else {
        if (confirm) confirm.hidden = false;
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

        if (total) total.innerText = (totalPrice / 100).toFixed(2) + '€';
    }
}