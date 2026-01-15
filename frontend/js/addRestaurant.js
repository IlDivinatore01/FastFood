/**
 * Restaurant setup and onboarding functionality for new owners.
 * 
 * This module guides restaurant setup with:
 * - Restaurant information collection and validation
 * - Business location and contact information setup
 * - Operating hours and service configuration
 * - Restaurant image upload and branding setup
 * - Initial menu category configuration
 * - Setup progress tracking and validation
 * - Onboarding completion and next steps guidance
 * 
 * Essential tool for restaurant owners to establish their platform presence.
 */

import { fetchApi } from './api.js';
import { addMessage } from './errorManager.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addRestaurantForm')?.addEventListener('submit', newRestaurant);
});

function sanitizeInput(value) {
    return value.trim().replace(/[<>]/g, '');
}

async function newRestaurant(e) {
    e.preventDefault();

    const nameInput = document.getElementById('name');
    const vatInput = document.getElementById('vat');
    const phoneInput = document.getElementById('phone');

    if (!nameInput.checkValidity() || !vatInput.checkValidity() || !phoneInput.checkValidity()) {
        addMessage('Please fix the errors before submitting.');
        return;
    }

    const formData = new FormData();
    formData.append('restaurant[name]', sanitizeInput(nameInput.value));
    formData.append('restaurant[vatNumber]', sanitizeInput(vatInput.value));
    formData.append('restaurant[phoneNumber]', phoneInput.value.trim());
    formData.append('restaurant[address][streetAddress]', document.getElementById('streetaddress').value.trim());
    formData.append('restaurant[address][city]', document.getElementById('city').value.trim());
    formData.append('restaurant[address][province]', document.getElementById('province').value.trim().toUpperCase());
    formData.append('restaurant[address][zipCode]', document.getElementById('zip').value.trim());

    const imageInput = document.getElementById('image');
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    const data = await fetchApi('/api/restaurant/add', {
        method: 'POST',
        body: formData
    });

    if (!data) return;

    localStorage.setItem('extraData', data.restaurant);
    window.location.href = '/home';
    return;
}