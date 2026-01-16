/**
 * Menu Manager Script
 * 
 * Owner interface for managing menu: add/remove dishes, set prices.
 */


import { fetchApi } from './api.js';
import { addMessage } from './errorManager.js';

const searchResults = document.getElementById('results');
const searchDish = document.getElementById('searchDish');
const currentDishes = document.getElementById('dishes');
const pagination = {
    prev: document.getElementById('pgPrev'),
    first: document.getElementById('pgFirst'),
    leftDots: document.getElementById('pgLeftDots'),
    current: document.getElementById('pgCurrent'),
    rightDots: document.getElementById('pgRightDots'),
    last: document.getElementById('pgLast'),
    next: document.getElementById('pgNext')
}
const newDish = {
    name: document.getElementById('newDishName'),
    category: document.getElementById('newDishCategory'),
    image: document.getElementById('newDishImage'),
    ingredients: document.getElementById('newDishIngredients')
}
const shownDish = {
    modal: document.getElementById('dishModal'),
    name: document.getElementById('dishModalTitle'),
    category: document.getElementById('dishModalCategory'),
    image: document.getElementById('dishModalImg'),
    ingredients: document.getElementById('dishModalIngredients'),
    price: document.getElementById('price'),
    prepTime: document.getElementById('prepTime'),
}
let dishModal = null; // Initialized in window.onload
const restId = localStorage.getItem('extraData');
let shownDishData = {
    data: null,
    index: null
}
let currentMenu = [];
let fetchedDishes = [];
let totalDishes = 0;
let currentPage = 1;
let maxPage = 1;

window.onload = () => {

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        dishModal = new bootstrap.Modal(shownDish.modal);
    }
    getCurrentMenu();
    getDishes();
    attachEventListeners();
}

function attachEventListeners() {
    document.getElementById('save-menu-changes-btn').addEventListener('click', submitChanges);

    document.getElementById('submit-dish-btn').addEventListener('click', submitDish);
    document.getElementById('search-dish-btn').addEventListener('click', () => {
        currentPage = 1;
        getDishes();
    });

    document.getElementById('save-dish-btn').addEventListener('click', saveDish);
    document.getElementById('removeBtn').addEventListener('click', () => removeDish(shownDishData.index));

    document.getElementById('pgPrevBtn')?.addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('pgNextBtn')?.addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('pgFirstBtn')?.addEventListener('click', () => goToPage(1));
    document.getElementById('pgLastBtn')?.addEventListener('click', () => goToPage(maxPage));
}

async function submitDish() {
    const formData = makeNewDishData();

    if (!formData) {
        return;
    }

    const data = await fetchApi('/api/dish/add', {
        method: 'POST',
        body: formData,
    });

    if (!data) return;

    for (const property in newDish) {
        newDish[property].value = '';
    }

    await getDishes();
    showDish({
        dish: data.dish._id,
        name: data.dish.name,
        category: data.dish.category,
        image: data.dish.image,
        ingredients: data.dish.ingredients,
        restaurant: data.dish.restaurant
    });
}

function makeNewDishData() {
    let isValid = true;
    if (!newDish.name.checkValidity()) {
        addMessage('Please enter a name.');
        isValid = false;
    }
    if (!newDish.category.checkValidity()) {
        addMessage('Please enter a category.');
        isValid = false;
    }
    if (!newDish.image.checkValidity()) {
        addMessage('Please select an image.');
        isValid = false;
    }
    if (!newDish.ingredients.checkValidity()) {
        addMessage('Please enter at least one ingredient.');
        isValid = false;
    }

    if (!isValid) return null;

    const name = newDish.name.value;
    const category = newDish.category.value;
    const image = newDish.image.files[0];
    const ingredients = newDish.ingredients.value;

    const splitIngredients = ingredients.split(',').map(i => i.trim());

    const formData = new FormData();
    formData.append('image', image);
    formData.append('name', name);
    formData.append('category', category);
    formData.append('restaurant', restId);
    splitIngredients.forEach(i => { formData.append('ingredients[]', i) });

    return formData;
}

async function getDishes() {
    const query = searchDish.value;
    const data = await fetchApi(`/api/dishes?restaurant=${restId}&query=${query}&page=${currentPage}`);

    if (!data) return;

    fetchedDishes = data.dishes.map(item => {
        return {
            dish: item._id,
            category: item.category,
            name: item.name,
            ingredients: item.ingredients,
            image: item.image,
        }
    });
    totalDishes = data.total;
    maxPage = Math.floor(totalDishes / 20) + (totalDishes % 20 > 0 ? 1 : 0);

    searchResults.innerHTML = '';
    makeDishesCards(fetchedDishes).forEach((dish) => { searchResults.append(dish) });
    searchResults.scrollTop = 0;

    setPagination();
}

function makeDishesCards(dishes, indexed) {
    let cards = [];
    for (let i = 0; i < dishes.length; i++) {
        const col = document.createElement('div');
        col.className = 'col my-2';
        col.onclick = () => { showDish(dishes[i], indexed ? i : null) };

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm border-0 cursor-pointer dish-card';
        card.style.transition = 'transform 0.2s';
        card.onmouseover = () => card.style.transform = 'translateY(-5px)';
        card.onmouseout = () => card.style.transform = 'translateY(0)';

        const cardImg = document.createElement('div');
        cardImg.style.backgroundImage = `url('${dishes[i].image}')`;
        cardImg.style.backgroundSize = 'cover';
        cardImg.style.backgroundPosition = 'center';
        cardImg.style.height = '160px';
        cardImg.className = 'card-img-top rounded-top';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const cardTitle = document.createElement('h6');
        cardTitle.className = 'card-title fw-bold text-truncate';
        cardTitle.innerText = dishes[i].name;
        cardTitle.title = dishes[i].name; // Tooltip for full name

        const cardCategory = document.createElement('p');
        cardCategory.className = 'card-text small text-secondary mb-2';
        cardCategory.innerText = dishes[i].category;


        if (dishes[i].price !== undefined) {
            const price = document.createElement('div');
            price.className = 'fw-bold text-primary';
            price.innerText = (dishes[i].price / 100).toFixed(2) + '€';
            cardBody.append(cardTitle, cardCategory, price);
        } else {
            cardBody.append(cardTitle, cardCategory);
        }

        card.append(cardImg, cardBody);
        col.append(card);
        cards.push(col);
    }

    return cards;
}

async function getCurrentMenu() {
    const data = await fetchApi(`/api/menu/${restId}`);

    if (!data) return;

    currentMenu = data.menu.map(item => {
        return {
            dish: item.dish._id,
            category: item.dish.category,
            name: item.dish.name,
            ingredients: item.dish.ingredients,
            image: item.dish.image,
            price: item.price,
            prepTime: item.preparationTime,
        }
    });

    makeDishesCards(currentMenu, true).forEach((dish) => { currentDishes.append(dish) });
}

function goToPage(page) {
    if (page > maxPage || page === currentPage) return;
    currentPage = page;
    getDishes();
}

function setPagination() {
    switch (currentPage) {
        case 1:
            pagination.prev.classList.add('disabled');
            pagination.first.hidden = true;
            pagination.leftDots.hidden = true;
            break;
        case 2:
            pagination.prev.classList.remove('disabled');
            pagination.first.hidden = false;
            pagination.leftDots.hidden = true;
            break;
        default:
            pagination.prev.classList.remove('disabled');
            pagination.first.hidden = false;
            pagination.leftDots.hidden = false;
    }

    switch (currentPage) {
        case (maxPage):
            pagination.next.classList.add('disabled');
            pagination.last.hidden = true;
            pagination.rightDots.hidden = true;
            break;
        case (maxPage - 1):
            pagination.next.classList.remove('disabled');
            pagination.last.hidden = false;
            pagination.rightDots.hidden = true;
            break;
        default:
            pagination.next.classList.remove('disabled');
            pagination.last.hidden = false;
            pagination.rightDots.hidden = false;
    }

    pagination.current.firstElementChild.innerText = currentPage;
    pagination.last.firstElementChild.innerText = maxPage;
}

function showDish(dish, index) {
    if (index === null || index === undefined) {
        const isPresent = currentMenu.findIndex(item => item.dish === dish.dish) !== -1;
        if (isPresent) {
            addMessage('Dish is already in the menu');
            return;
        }
    }

    shownDishData = { data: dish, index };

    shownDish.name.innerText = dish.name;
    shownDish.category.innerText = dish.category;
    shownDish.image.src = dish.image;
    shownDish.ingredients.innerHTML = '';
    shownDish.price.value = (typeof dish.price === 'number') ? (dish.price / 100).toFixed(2) : '';
    shownDish.prepTime.value = (dish.prepTime ?? '');

    dish.ingredients.forEach(ingredient => {
        const ingredientElement = document.createElement('li');
        ingredientElement.innerText = ingredient;
        shownDish.ingredients.append(ingredientElement);
    });

    if (index !== null && index !== undefined) {
        document.getElementById('removeBtn').hidden = false;
    }

    dishModal.show();
}

function saveDish() {
    let isValid = true;
    if (!shownDish.price.checkValidity()) {
        addMessage('Insert a valid price in the format <euros>.<cents>');
        isValid = false;
    }
    if (!shownDish.prepTime.checkValidity()) {
        addMessage('Insert a valid preparation time.');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    const dish = {
        dish: shownDishData.data.dish,
        category: shownDishData.data.category,
        name: shownDishData.data.name,
        ingredients: shownDishData.data.ingredients,
        image: shownDishData.data.image,
        price: shownDish.price.value * 100,
        prepTime: shownDish.prepTime.value,
    }

    if (!(shownDishData.index === null || shownDishData.index === undefined)) {
        currentMenu[shownDishData.index] = dish;
    } else {
        currentMenu.push(dish);
    }

    currentDishes.innerHTML = '';
    makeDishesCards(currentMenu, true).forEach((dish) => { currentDishes.append(dish) });
    dishModal.hide();
}

function removeDish(index) {
    currentMenu.splice(index, 1);

    currentDishes.innerHTML = '';
    makeDishesCards(currentMenu, true).forEach((dish) => { currentDishes.append(dish) });
    dishModal.hide();
}

async function submitChanges() {
    const newMenu = currentMenu.map((dish) => {
        return {
            dish: dish.dish,
            price: dish.price,
            preparationTime: dish.prepTime
        }
    });

    const data = await fetchApi('/api/menu/update', {
        method: 'PUT',
        body: JSON.stringify({ newMenu, restaurant: restId }),
    });

    if (data) {
        addMessage('Menu updated successfully!', false);
    }
}

