/**
 * Edit Profile Script
 * 
 * Handles profile form submission, password change, image upload.
 * Manages address editing and card management.
 */


import { fetchApi } from './api.js';
import { setLoadingState } from './uiUtils.js';
import { addMessage } from './errorManager.js';

let profileForm = {
    tab: document.getElementById('profile-tab'),
    pane: document.getElementById('profile-tab-pane'),
    firstName: document.getElementById('first-name'),
    lastName: document.getElementById('last-name'),
    currentName: document.getElementById('current-name'),
    username: document.getElementById('username'),
    currentUsername: document.getElementById('current-username'),
    email: document.getElementById('email'),
    currentEmail: document.getElementById('current-email'),
    currentPassword: document.getElementById('current-password'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirm-password'),
    image: document.getElementById('image'),
    currentImage: document.getElementById('current-image'),
}

let addressForm = {
    tab: document.getElementById('address-tab'),
    pane: document.getElementById('address-tab-pane'),
    street: document.getElementById('street'),
    currentStreet: document.getElementById('current-street'),
    city: document.getElementById('city'),
    currentCity: document.getElementById('current-city'),
    province: document.getElementById('province'),
    currentProvince: document.getElementById('current-province'),
    zipCode: document.getElementById('zip-code'),
    currentZipCode: document.getElementById('current-zip-code')
}

let cardsForm = {
    tab: document.getElementById('pay-tab'),
    pane: document.getElementById('pay-tab-pane'),
    owner: document.getElementById('new-card-owner'),
    number: document.getElementById('new-card-number'),
    expiry: document.getElementById('new-card-expiry'),
    cvc: document.getElementById('new-card-cvc'),
    currentCards: document.getElementById('current-cards'),
}

let restaurantForm = {
    tab: document.getElementById('restaurant-tab'),
    pane: document.getElementById('restaurant-tab-pane'),
    name: document.getElementById('restaurant-name'),
    currentName: document.getElementById('current-restaurant-name'),
    street: document.getElementById('restaurant-street'),
    currentStreet: document.getElementById('current-restaurant-street'),
    city: document.getElementById('restaurant-city'),
    currentCity: document.getElementById('current-restaurant-city'),
    province: document.getElementById('restaurant-province'),
    currentProvince: document.getElementById('current-restaurant-province'),
    zipCode: document.getElementById('restaurant-zip-code'),
    currentZipCode: document.getElementById('current-restaurant-zip-code'),
    phone: document.getElementById('restaurant-phone'),
    currentPhone: document.getElementById('current-restaurant-phone'),
    vat: document.getElementById('restaurant-vat'),
    currentVat: document.getElementById('current-restaurant-vat'),
    image: document.getElementById('restaurant-image'),
    currentImage: document.getElementById('current-restaurant-image'),
}

let profileData;

window.onload = () => {
    getProfile()
        .then((profile) => {
            profileData = profile;
            fillForms();
            if (profileData.cards) showCards(makeCards(profileData.cards));
            attachEventListeners(); // Attach event listeners after data is loaded
        });
}

function attachEventListeners() {
    document.getElementById('submit-profile-btn')?.addEventListener('click', editProfile);
    document.getElementById('submit-address-btn')?.addEventListener('click', editAddress);
    document.getElementById('add-card-btn')?.addEventListener('click', addCard);
    document.getElementById('submit-restaurant-btn')?.addEventListener('click', editRestaurant);
}

async function getProfile() {
    const data = await fetchApi('/api/profile', { method: 'GET' });
    if (!data) return;
    return data;
}

function fillForms() {
    profileForm.currentName.innerText = 'Current: ' + profileData.profile.firstName + ' ' + profileData.profile.lastName;
    profileForm.currentUsername.innerText = 'Current: ' + profileData.profile.username;
    profileForm.currentEmail.innerText = 'Current: ' + profileData.profile.email;
    profileForm.currentImage.src = profileData.profile.image;
    profileForm.username.disabled = true;

    if (profileData.address) {
        addressForm.tab.hidden = false;
        addressForm.currentStreet.innerText = 'Current: ' + profileData.address.streetAddress;
        addressForm.currentCity.innerText = 'Current: ' + profileData.address.city;
        addressForm.currentProvince.innerText = 'Current: ' + profileData.address.province;
        addressForm.currentZipCode.innerText = 'Current: ' + profileData.address.zipCode;
    }
    else addressForm.pane.remove();

    if (profileData.cards) {
        cardsForm.tab.hidden = false;
    }
    else cardsForm.pane.remove();

    if (profileData.restaurant) {
        restaurantForm.tab.hidden = false;
        restaurantForm.currentName.innerText = 'Current: ' + profileData.restaurant.name;
        restaurantForm.currentStreet.innerText = 'Current: ' + profileData.restaurant.address.streetAddress;
        restaurantForm.currentCity.innerText = 'Current: ' + profileData.restaurant.address.city;
        restaurantForm.currentProvince.innerText = 'Current: ' + profileData.restaurant.address.province;
        restaurantForm.currentZipCode.innerText = 'Current: ' + profileData.restaurant.address.zipCode;
        restaurantForm.currentPhone.innerText = 'Current: ' + profileData.restaurant.phoneNumber;
        restaurantForm.currentVat.innerText = 'Current: ' + profileData.restaurant.vatNumber;
        restaurantForm.currentImage.src = profileData.restaurant.image;
    } else restaurantForm.pane.remove();
}

async function removeCard(id){
    const data = await fetchApi(`/api/card/delete/${id}`, { method: 'DELETE' });

    if (!data) return false;

    profileData.cards = data.cards;
    return true;
}

async function addCard() {
    if (!cardsForm.owner.checkValidity() ||
        !cardsForm.number.checkValidity() ||
        !cardsForm.expiry.checkValidity() ||
        !cardsForm.cvc.checkValidity()) {
        addMessage('Please fill all card fields correctly.');
        return;
    }

    const card = {
        cardOwner: cardsForm.owner.value,
        cardNumber: cardsForm.number.value,
        expiryDate: cardsForm.expiry.value,
        cvc: cardsForm.cvc.value
    };

    const data = await fetchApi('/api/card/add', {
        method: 'POST',
        body: JSON.stringify({ card })
    });

    if (!data) return;

    profileData.cards = data.cards;
    addMessage('Card added successfully!', false);

    cardsForm.owner.value = '';
    cardsForm.number.value = '';
    cardsForm.expiry.value = '';
    cardsForm.cvc.value = '';

    cardsForm.currentCards.innerHTML = '';
    showCards(makeCards(profileData.cards));
}

function makeCards(cards) {
    let cardsArray = [];
    cards.forEach((card) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';

        const cardElement = document.createElement('div');
        cardElement.className = 'card bg-dark-subtle my-2';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const owner = document.createElement('p');
        owner.className = 'card-text mb-1';
        owner.innerText = 'Owner: ' + card.cardOwner;

        const expiry = document.createElement('p');
        expiry.className = 'card-text mb-1';
        expiry.innerText = 'Expiration date: ' + card.expiryDate;

        const number = document.createElement('p');
        number.className = 'card-text mb-2';
        number.innerText = 'Number: **** **** **** ' + (card.cardNumber?.slice(-4) || '');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerText = 'Remove card';
        removeBtn.className = 'btn btn-danger w-100';
        removeBtn.onclick = () => { removeCard(card._id).then((res => { if (res) col.remove() })); };

        cardBody.append(owner, expiry, number, removeBtn);
        cardElement.append(cardBody);
        col.append(cardElement);

        cardsArray.push(col);
    });

    return cardsArray;
}

function showCards(cards) {
    cardsForm.currentCards.innerHTML = '';
    cards.forEach(card => cardsForm.currentCards.append(card));
}

async function editAddress() {
    const submitBtn = document.querySelector('#address-tab-pane button');
    setLoadingState(submitBtn, true);

    const newAddress = {
        streetAddress: addressForm.street.value || null,
        city: addressForm.city.value || null,
        province: addressForm.province.value || null,
        zipCode: addressForm.zipCode.value || null
    };

    const data = await fetchApi(`/api/address/update`, {
        method: 'PUT',
        body: JSON.stringify({address: newAddress}),
    });

    setLoadingState(submitBtn, false);

    if (data) {
        addMessage('Address updated successfully!', false);
        setTimeout(() => { window.location.href = '/profile'; }, 1500);
    }
}

async function editProfile() {
    const submitBtn = document.querySelector('#profile-tab-pane button');
    setLoadingState(submitBtn, true);

    const formData = new FormData();
    const newProfile = {
        firstName: profileForm.firstName.value || null,
        lastName: profileForm.lastName.value || null,
        email: profileForm.email.value || null,
        password: profileForm.currentPassword.value || null,
        newPassword: profileForm.password.value || null,
        confirmPassword: profileForm.confirmPassword.value || null
    };

    for (const key in newProfile) {
        if (newProfile[key]) {
            formData.append(`newProfile[${key}]`, newProfile[key]);
        }
    }

    if (profileForm.image.files[0]) {
        formData.append('image', profileForm.image.files[0]);
    }

    if (profileForm.email.value && !profileForm.email.checkValidity()) {
        addMessage('Please insert a valid email address.');
        setLoadingState(submitBtn, false);
        return;
    }

    const data = await fetchApi(`/api/profile/update`, {
        method: 'PUT',
        body: formData,
    });

    setLoadingState(submitBtn, false);

    if (data) {
        addMessage('Profile updated successfully!', false);
        setTimeout(() => { window.location.href = '/profile'; }, 1500);
    }
}

async function editRestaurant() {
    const submitBtn = document.querySelector('#restaurant-tab-pane button');
    setLoadingState(submitBtn, true);

    const formData = new FormData();
    const newRestaurant = {
        name: restaurantForm.name.value || null,
        address: {
            streetAddress: restaurantForm.street.value || null,
            city: restaurantForm.city.value || null,
            province: restaurantForm.province.value || null,
            zipCode: restaurantForm.zipCode.value || null
        },
        phone: restaurantForm.phone.value || null,
        vatNumber: restaurantForm.vat.value || null
    };

    for (const key in newRestaurant) {
        if (typeof newRestaurant[key] === 'object' && newRestaurant[key] !== null) {
            for (const subKey in newRestaurant[key]) {
                if (newRestaurant[key][subKey]) {
                    formData.append(`newRestaurant[${key}][${subKey}]`, newRestaurant[key][subKey]);
                }
            }
        } else if (newRestaurant[key]) {
            formData.append(`newRestaurant[${key}]`, newRestaurant[key]);
        }
    }

    if (restaurantForm.image.files[0]) {
        formData.append('image', restaurantForm.image.files[0]);
    }

    const data = await fetchApi(`/api/restaurant/update`, {
        method: 'PUT',
        body: formData,
    });

    setLoadingState(submitBtn, false);

    if (data) {
        addMessage('Restaurant updated successfully!', false);
        setTimeout(() => { window.location.href = '/profile'; }, 1500);
    }
}