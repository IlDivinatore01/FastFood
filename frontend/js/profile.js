/**
 * User profile display and account information management.
 * 
 * This module handles profile functionality including:
 * - User account information display and formatting
 * - Order history retrieval and presentation
 * - Account settings and preferences display
 * - Profile image handling and display
 * - Account security information and status
 * - User type-specific profile features
 * - Navigation to profile editing interfaces
 * 
 * Comprehensive user account overview and management interface.
 */

import { fetchApi } from './api.js';
import { createCard, renderPagination } from './components.js';
import { addMessage } from './errorManager.js';

const userProfile = {
    profile: document.getElementById('profile'),
    username: document.getElementById('username'),
    firstName: document.getElementById('firstname'),
    lastName: document.getElementById('lastname'),
    email: document.getElementById('email'),
    type: document.getElementById('type'),
};

const userAddress = {
    street: document.getElementById('usrstraddress'),
    city: document.getElementById('usrcity'),
    province: document.getElementById('usrprov'),
    zip: document.getElementById('usrzip')
}

const restaurantData = {
    name: document.getElementById('restname'),
    phone: document.getElementById('restphone'),
    address: {
        street: document.getElementById('reststraddress'),
        city: document.getElementById('restcity'),
        province: document.getElementById('restprov'),
        zip: document.getElementById('restzip'),
    }
}

const pagination = {
    prev: document.getElementById('pgPrev'),
    first: document.getElementById('pgFirst'),
    leftDots: document.getElementById('pgLeftDots'),
    current: document.getElementById('pgCurrent'),
    rightDots: document.getElementById('pgRightDots'),
    last: document.getElementById('pgLast'),
    next: document.getElementById('pgNext'),
    nav: document.getElementById('pag-nav')
}

let deactivateModal = {
    modalhtml: document.getElementById('deactivate-modal'),
    modal: null,
    password: document.getElementById('deactivate-password'),
}

let fetchedProfile;
const ordersElement = document.getElementById('orders');
let currentPage = 1;
let totalOrders;
let maxPage = 1;

const loader = document.getElementById('loader');
const profileContent = document.getElementById('profile-content');

window.onload = async () => {
    loader.hidden = false;
    profileContent.hidden = true;

    fetchedProfile = await getProfile();
    if (fetchedProfile) {
        deactivateModal.modal = new bootstrap.Modal(deactivateModal.modalhtml);
        showOrders();
        attachEventListeners();
    }

    loader.hidden = true;
    profileContent.hidden = false;
}

function attachEventListeners() {
    document.getElementById('edit-profile-btn').addEventListener('click', editProfile);
    document.getElementById('deactivate-btn').addEventListener('click', deactivateBtn);
    document.getElementById('deactivate-confirm-btn').addEventListener('click', deactivateAccount);

    const analyticsBtn = document.getElementById('analytics-btn');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', analytics);
    }

    document.getElementById('pgPrevBtn')?.addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('pgNextBtn')?.addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('pgFirstBtn')?.addEventListener('click', () => goToPage(1));
    document.getElementById('pgLastBtn')?.addEventListener('click', () => goToPage(maxPage));
}

async function getProfile() {
    const data = await fetchApi('/api/profile');
    if (!data) return;

    // Generic user info
    document.getElementById('profile-picture').src = data.profile.image || '/images/default-profile.png';
    document.getElementById('username-display').innerText = data.profile.username ? `@${data.profile.username}` : '';
    document.getElementById('fullname-display').innerText = `${data.profile.firstName} ${data.profile.lastName}`;
    document.getElementById('email-display').innerText = data.profile.email;
    document.getElementById('type-display').innerText = data.profile.type;

    // Check type from profile object
    if (data.profile.type === 'customer') {
        const usrAddr = document.getElementById('usraddress');
        usrAddr.hidden = false;

        // Populate address fields if they exist
        if (data.address) {
            document.getElementById('usrstraddress').innerText = data.address.streetAddress;
            document.getElementById('usrcity').innerText = data.address.city;
            document.getElementById('usrprov').innerText = data.address.province;
            document.getElementById('usrzip').innerText = data.address.zipCode;
        } else {
            // Handle case with no address set yet
            usrAddr.innerHTML = '<p class="text-muted small fst-italic mt-3">No address configured.</p>';
        }

    } else if (data.profile.type === 'owner') {
        const restCard = document.getElementById('restaurant');
        restCard.hidden = false;

        document.getElementById('restname').innerText = data.restaurant.name;
        document.getElementById('restphone').innerText = data.restaurant.phoneNumber; // Use phoneNumber property
        document.getElementById('reststraddress').innerText = data.restaurant.address.streetAddress;
        document.getElementById('restcity').innerText = data.restaurant.address.city;
        document.getElementById('restprov').innerText = data.restaurant.address.province;
        document.getElementById('restzip').innerText = data.restaurant.address.zipCode;

        const buttonContainer = document.getElementById('edit-profile-btn').parentElement;
        const analyticsBtn = document.createElement('button');
        analyticsBtn.type = 'button';
        analyticsBtn.id = 'analytics-btn';
        analyticsBtn.className = 'btn btn-info my-2';
        analyticsBtn.innerText = 'View Analytics';
        buttonContainer.insertBefore(analyticsBtn, document.getElementById('deactivate-btn'));

    } else {
        document.getElementById('restaurant').remove();
    }

    return data;
}

function editProfile() {
    window.location.href = '/profile/edit';
}

function analytics() {
    window.location.href = '/restaurant/analytics';
}

async function getOrders(page) {
    const data = await fetchApi(`/api/orders?page=${page}`);
    if (!data) return;

    totalOrders = data.total;
    maxPage = totalOrders > 0 ? Math.ceil(totalOrders / 10) : 1;

    let orders = [];
    for (let order of data.orders) {
        const newOrder = await getEstimation(order);
        orders.push(newOrder);
    }

    return orders;
}

async function getEstimation(order) {
    if (!(order.state === 'received' || order.state === 'preparing') || fetchedProfile.restaurant) {
        return order;
    }

    try {
        const data = await fetchApi(`/api/estimate/${order._id}`);
        if (!data) return order;

        return {
            ...order,
            estimatedTime: data.time
        };
    } catch (error) {
        console.warn(`Failed to get estimation for order ${order._id}:`, error);
        return order;
    }
}

async function showOrders() {
    loader.hidden = false;
    ordersElement.innerHTML = '';

    const receivedOrders = await getOrders(currentPage);

    if (totalOrders === 0) {
        ordersElement.innerText = 'No orders yet.';
        return;
    }

    orderCards(receivedOrders).forEach(order => {
        ordersElement.append(order);
    });

    renderPagination(pagination.nav, {
        currentPage: currentPage,
        maxPage: maxPage,
        onPageChange: goToPage
    });
    loader.hidden = true;
}

function createOrderCard(order) {
    const bodyText = `Status: ${order.state}\nAmount: ${order.amount}\nTotal: ${(order.price / 100).toFixed(2)}€`;
    const cardCol = createCard({
        imageSrc: order.dish.image,
        title: order.dish.name,
        bodyText: bodyText,
        colClass: 'col-12 col-md-6 col-lg-4'
    });

    const cardBody = cardCol.querySelector('.card-body');

    if (!fetchedProfile.restaurant) {
        addRestaurantInfo(cardBody, order);
    } else {
        addCustomerInfo(cardBody, order);
    }

    if (order.estimatedTime) {
        addEstimatedTime(cardBody, order.estimatedTime);
    }

    if (!fetchedProfile.restaurant && order.state === 'ready') {
        addConfirmPickupButton(cardBody, order._id);
    }

    return cardCol;
}

function addRestaurantInfo(cardBody, order) {
    const restaurantText = document.createElement('p');
    restaurantText.className = 'card-text small';
    restaurantText.innerText = 'Restaurant: ';
    const restaurantLink = document.createElement('a');
    restaurantLink.href = `/restaurant/${order.restaurant._id}`;
    restaurantLink.innerText = order.restaurant.name;
    restaurantText.appendChild(restaurantLink);
    cardBody.appendChild(restaurantText);
}

function addCustomerInfo(cardBody, order) {
    const customerName = (order.customer?.firstName && order.customer?.lastName)
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : (order.customer?.name || 'N/A');
    const customerText = document.createElement('p');
    customerText.className = 'card-text small';
    customerText.innerText = `Customer: ${customerName}`;
    cardBody.appendChild(customerText);
}

function formatEstimatedTime(totalMinutes) {
    if (totalMinutes < 60) {
        return `~${totalMinutes} minutes`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
    if (minutes === 0) {
        return `~${hourText}`;
    }
    const minuteText = minutes === 1 ? '1 minute' : `${minutes} minutes`;
    return `~${hourText} and ${minuteText}`;
}

function addEstimatedTime(cardBody, estimatedTime) {
    const estimate = document.createElement('p');
    estimate.className = 'card-text small text-info';
    const totalMinutes = Math.ceil(estimatedTime);
    estimate.innerText = `Estimated time: ${formatEstimatedTime(totalMinutes)}`;
    cardBody.appendChild(estimate);
}

function addConfirmPickupButton(cardBody, orderId) {
    const confBtn = document.createElement('button');
    confBtn.type = 'button';
    confBtn.className = 'btn btn-sm btn-secondary mt-auto';
    confBtn.innerText = 'Confirm pickup';
    confBtn.onclick = (e) => {
        e.stopPropagation();
        confirmPickup(orderId).then((res) => {
            if (res) {
                const statusEl = Array.from(cardBody.querySelectorAll('.card-text')).find(el => el.innerText.startsWith('Status:'));
                if (statusEl) statusEl.innerText = `Status: completed`;
                confBtn.remove();
            }
        });
    };
    cardBody.appendChild(confBtn);
}

function orderCards(orders) {
    return orders.map(createOrderCard);
}

async function confirmPickup(orderId) {
    const data = await fetchApi(`/api/confirmpickup/${orderId}`, { method: 'PUT' });
    return !!data;
}

function goToPage(page) {
    if (page < 1 || page > maxPage) return;
    currentPage = page;
    showOrders();
}

function deactivateBtn() {
    deactivateModal.modal.show();
}

async function deactivateAccount() {
    if (!deactivateModal.password.checkValidity()) {
        addMessage('Please insert a valid password.');
        return;
    }
    const password = deactivateModal.password.value;
    const data = await fetchApi(`/api/deactivate`, {
        method: 'DELETE',
        body: JSON.stringify({ password }),
    });
    if (data?.success) {
        localStorage.clear();
        window.location.href = '/';
    } else {
        addMessage(data?.message || 'Failed to deactivate account.');
    }
}