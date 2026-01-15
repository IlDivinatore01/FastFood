/**
 * Authentication form handling and user login functionality.
 * 
 * This module manages the login process with:
 * - Login form validation and submission
 * - User credential verification with backend API
 * - Authentication token handling and storage
 * - Login error handling and user feedback
 * - Redirect logic based on user type and setup status
 * - Remember me functionality and session management
 * - Form security and input sanitization
 * 
 * Core authentication module enabling secure user access to the platform.
 */

import { fetchApi } from './api.js';
import { addMessage } from './errorManager.js';
import { validateInput } from './uiUtils.js';

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
        addMessage('Registration successful! Please log in.', false);
    }

    document.querySelectorAll('#content input').forEach(input => {
        input.addEventListener('input', () => validateInput(input));
    });
}

// Attach listeners immediately (Module is deferred)
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
    e.preventDefault(); // Prevent default form submission

    const usernameInput = document.getElementById('username');
    const password = document.getElementById('password');

    validateInput(usernameInput);
    validateInput(password);

    if (!usernameInput.checkValidity() || !password.checkValidity()) {
        addMessage('Please fix the errors before submitting.');
        return;
    }

    const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: usernameInput.value, password: password.value }),
    });

    if (data) {
        localStorage.setItem('username', data.username);
        localStorage.setItem('extraData', data.extraData);
        window.location.href = '/home';
    }
}

async function handleRegister(e) {
    e.preventDefault(); // Prevent default form submission

    const inputs = {
        username: document.getElementById('username'),
        firstName: document.getElementById('firstname'),
        lastName: document.getElementById('lastname'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        type: document.getElementById('type'),
        image: document.getElementById('image'),
    };

    let allValid = true;
    for (const key in inputs) {
        if (key === 'image') continue;
        validateInput(inputs[key]);
        if (!inputs[key].checkValidity()) {
            allValid = false;
        }
    }

    if (!allValid) {
        addMessage('Please fix the errors before submitting.');
        return;
    }

    if (inputs.password.value !== inputs.confirmPassword.value) {
        addMessage('Passwords do not match.');
        return;
    }

    const formData = new FormData();
    formData.append('username', inputs.username.value);
    formData.append('firstName', inputs.firstName.value);
    formData.append('lastName', inputs.lastName.value);
    formData.append('email', inputs.email.value);
    formData.append('password', inputs.password.value);
    formData.append('confirmPassword', inputs.confirmPassword.value);
    formData.append('type', inputs.type.value);
    if (inputs.image.files[0]) {
        formData.append('image', inputs.image.files[0]);
    }

    const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: formData,
    });

    if (data) {
        window.location.href = '/?registered=true';
    }
}

async function isLoggedIn() {
    const data = await fetchApi('/auth/check');

    if (data?.ok) {
        window.location.href = '/home';
        return;
    }

    localStorage.clear();
}