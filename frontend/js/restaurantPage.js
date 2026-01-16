/**
 * Restaurant Page Script
 * 
 * Displays restaurant menu, handles dish selection and add-to-cart.
 */


import { fetchApi } from './api.js';
import { addToCart, showCartButton, getCart } from './cartManager.js';
import { addMessage } from './errorManager.js';
import { createCard } from './components.js';

const restaurantInfo = {
    name: document.getElementById('restaurant-name'),
    phone: document.getElementById('restaurant-phone'),
    address: document.getElementById('restaurant-address'),
    image: document.getElementById('restaurant-image'),
    phoneTitle: document.getElementById('phone-title'),
    menuTitle: document.getElementById('menu-title'),
    addressTitle: document.getElementById('address-title')
};
const menuElement = document.getElementById('menu');
const dishModal = {
    modal: null, // Initialized in window.onload
    name: document.getElementById('dishModalTitle'),
    category: document.getElementById('dishModalCategory'),
    price: document.getElementById('dishPrice'),
    image: document.getElementById('dishModalImg'),
    ingredients: document.getElementById('dishModalIngredients'),
    amount: document.getElementById('dishAmount')
};
let menu = [];
let shownDish;
let restId;
let currentCart;

window.onload = async () => {

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        dishModal.modal = new bootstrap.Modal(document.getElementById('dishModal'));
    }


    currentCart = getCart();

    const path = window.location.pathname.split('/');
    restId = path[path.length - 1];
    await getMenu();

    showCartButton();
    document.getElementById('add-to-cart-btn').addEventListener('click', dishToCart);
}

async function getMenu() {
    const data = await fetchApi(`/api/menu/${restId}`);

    if (!data) {
        window.location.href = '/home';
        return;
    }

    restaurantInfo.name.innerText = data.name;
    restaurantInfo.image.src = data.image;
    if (!data.active) {
        restaurantInfo.phoneTitle.innerText = '';
        restaurantInfo.menuTitle.innerText = '';
        restaurantInfo.addressTitle.innerText = 'This restaurant is permanently closed.';
        return;
    }
    restaurantInfo.address.innerText = data.address.streetAddress + '\n' + data.address.city + ' ' + data.address.province;
    restaurantInfo.phone.innerText = data.phoneNumber; // Corrected from data.phone
    menu = data.menu.map(item => {
        return {
            dish: item.dish._id,
            category: item.dish.category,
            name: item.dish.name,
            ingredients: item.dish.ingredients,
            image: item.dish.image,
            price: item.price,
            prepTime: item.preparationTime,
            restaurant: restId // Add the restaurant ID to each dish object
        }
    });
    makeDishesCards(menu).forEach((dish) => { menuElement.append(dish) });
}

function makeDishesCards(dishes) {
    return dishes.map(dish => {
        return createCard({
            imageSrc: dish.image,
            title: dish.name,
            bodyText: `${(dish.price / 100).toFixed(2)}€`,
            onClick: () => showDish(dish),
            colClass: 'col-12 col-sm-6 col-md-4 col-lg-3'
        });
    });
}

function showDish(dish) {
    shownDish = dish;
    currentCart = getCart();

    dishModal.name.innerText = dish.name;
    dishModal.category.innerText = dish.category;
    dishModal.price.innerText = dish.price / 100 + '€';
    dishModal.image.src = dish.image;
    dishModal.ingredients.innerHTML = '';
    dish.ingredients.forEach(ingredient => {
        const ingredientElement = document.createElement('li');
        ingredientElement.innerText = ingredient;
        dishModal.ingredients.append(ingredientElement);
    });


    dishModal.amount.value = 1;

    dishModal.modal.show();
}

function dishToCart() {
    if (!dishModal.amount.checkValidity()) {
        addMessage('Please insert a valid amount.');
        return;
    }
    addToCart(shownDish, dishModal.amount.value);
    dishModal.modal.hide();
}