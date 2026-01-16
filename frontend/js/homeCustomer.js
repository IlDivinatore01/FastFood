/**
 * Customer dashboard functionality and restaurant discovery interface.
 * 
 * This module powers the customer home page with:
 * - Restaurant listing and search functionality
 * - Category-based filtering and sorting options
 * - Restaurant card rendering and interaction handling
 * - Pagination for large restaurant lists
 * - Featured restaurants and promotional content
 * - Search autocomplete and suggestion features
 * - Responsive grid layout for restaurant display
 * 
 * Main interface for customers to discover and select restaurants for ordering.
 */

import { fetchApi } from './api.js';
import { addToCart } from './cartManager.js';
import { addMessage } from './errorManager.js';
import { createCard, renderPagination } from './components.js';

let dishElements = {
    searchName: document.getElementById('dish-name'),
    searchCategory: document.getElementById('dish-category'),
    maxPrice: document.getElementById('dish-price'),
    results: document.getElementById('dish-results'),
    paginationNav: document.getElementById('dish-pag-nav'),
    currentPage: 1,
    maxPage: 1
}

let dishModal = {
    modal: new bootstrap.Modal(document.getElementById('dish-modal')),
    title: document.getElementById('dish-modal-title'),
    body: document.getElementById('dish-modal-body'),
    img: document.getElementById('dish-modal-img'),
    restaurant: document.getElementById('dish-modal-restaurant'),
    category: document.getElementById('dish-modal-category'),
    ingredients: document.getElementById('dish-modal-ingredients'),
    price: document.getElementById('dish-modal-price'),
    amount: document.getElementById('dish-modal-amount'),
}

let restaurantElements = {
    searchName: document.getElementById('restaurant-name'),
    searchCity: document.getElementById('restaurant-city'),
    searchStreet: document.getElementById('restaurant-street'),
    results: document.getElementById('restaurant-results'),
    paginationNav: document.getElementById('restaurant-pag-nav'),
    currentPage: 1,
    maxPage: 1
}

const nearby = document.getElementById('nearby');

let currentDishes;
let currentRestaurants;
let currentNearby;
let shownDish = {};
let shownDishData = {};
let currentCart;

window.onload = () => {
    currentCart = JSON.parse(localStorage.getItem('cart')) || {};
    attachEventListeners();
    searchDishes();
    searchRestaurants();
    getNearby().then(restaurants => { currentNearby = restaurants });
}

function attachEventListeners() {
    document.getElementById('search-dish-btn').addEventListener('click', () => {
        dishElements.currentPage = 1;
        searchDishes();
    });

    document.getElementById('search-restaurant-btn').addEventListener('click', () => {
        restaurantElements.currentPage = 1;
        searchRestaurants();
    });

    document.getElementById('add-to-cart-btn').addEventListener('click', dishToCart);
}

async function searchDishes() {
    const name = dishElements.searchName.value;
    const category = dishElements.searchCategory.value;
    const price = dishElements.maxPrice.value;
    const page = dishElements.currentPage;

    const params = new URLSearchParams();

    if (name) params.append('name', name);
    if (category) params.append('category', category);
    if (price) params.append('price', (price * 100).toString());
    params.append('page', page);
    const query = params.toString();

    const data = await fetchApi(`/api/dishes/search?${query}`);

    if (!data) return;

    dishElements.results.innerHTML = '';
    dishElements.results.scrollLeft = 0;
    dishElements.maxPage = Math.max(Math.floor(data.total / 20) + (data.total % 20 > 0 ? 1 : 0), 1);

    showCards(makeDishesCards(data.dishes), dishElements.results);
    renderPagination(dishElements.paginationNav, {
        currentPage: dishElements.currentPage,
        maxPage: dishElements.maxPage,
        onPageChange: (page) => goToPage(page, 'dish')
    });

    return data.dishes;
}

function makeDishesCards(dishes) {
    return dishes.map(dish => {
        return createCard({
            imageSrc: dish.dish.image,
            title: dish.dish.name,
            bodyText: `${(dish.price / 100).toFixed(2)}€`,
            onClick: () => showDish(dish),
            colClass: 'col-12 col-sm-6 col-md-4 col-lg-3 my-2'
        });
    });
}

function showCards(cards, container) {
    container.innerHTML = '';
    if (cards.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'col-12 text-center text-body-secondary';
        noResults.innerText = 'No results found.';
        container.appendChild(noResults);
        return;
    }
    cards.forEach((card) => { container.append(card) });
}
function showDish(dish) {
    shownDish = dish;

    dishModal.title.innerText = dish.dish.name;
    dishModal.img.src = dish.dish.image;
    dishModal.restaurant.innerText = `Restaurant: ${dish.restaurantName}`;
    dishModal.category.innerText = `Category: ${dish.dish.category}`;
    dishModal.price.innerText = `Price: ${dish.price / 100}€`;

    dishModal.ingredients.innerHTML = '';
    dish.dish.ingredients.forEach(ingredient => {
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

async function searchRestaurants() {
    const name = restaurantElements.searchName.value;
    const street = restaurantElements.searchStreet.value;
    const city = restaurantElements.searchCity.value;
    const page = restaurantElements.currentPage;

    const params = new URLSearchParams();

    if (name) params.append('name', name);
    if (street) params.append('street', street);
    if (city) params.append('city', city);
    params.append('page', page);
    const query = params.toString();

    const data = await fetchApi(`/api/restaurant/search?${query}`);

    if (!data) return;

    restaurantElements.results.innerHTML = '';
    restaurantElements.results.scrollLeft = 0;
    restaurantElements.maxPage = Math.max(Math.floor(data.total / 20) + (data.total % 20 > 0 ? 1 : 0), 1);

    showCards(makeRestaurantCards(data.restaurants), restaurantElements.results);
    renderPagination(restaurantElements.paginationNav, {
        currentPage: restaurantElements.currentPage,
        maxPage: restaurantElements.maxPage,
        onPageChange: (page) => goToPage(page, 'restaurant')
    });
}

async function getNearby() {
    const data = await fetchApi('/api/nearby');

    if (!data) return;

    showCards(makeRestaurantCards(data.nearbyRestaurants), nearby);
    return data.nearbyRestaurants;
}

function makeRestaurantCards(restaurants) {
    return restaurants.map(restaurant => createCard({
        imageSrc: restaurant.image,
        title: restaurant.name,
        bodyText: `${restaurant.address.city}, ${restaurant.address.streetAddress}`,
        onClick: () => { window.location.href = `/restaurant/${restaurant._id}`; }
    }));
}

async function goToPage(page, which) {
    if (which === 'dish') {
        dishElements.currentPage = page;
        await searchDishes();
    }
    if (which === 'restaurant') {
        restaurantElements.currentPage = page;
        await searchRestaurants();
    }
}