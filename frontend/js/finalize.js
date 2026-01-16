/**
 * Finalize Setup Script
 * 
 * Handles customer onboarding form submission (address + card).
 */

import { fetchApi } from './api.js';

const form = document.getElementById('finalizeForm');
const submitBtn = document.getElementById('finalize-btn');

const validators = {
    'addr-street': (val) => val.trim().length > 0,
    'addr-city': (val) => val.trim().length > 0,
    'addr-province': (val) => /^[A-Za-z]{2}$/.test(val),
    'addr-zip': (val) => /^\d{5}$/.test(val),
    'card-owner': (val) => val.trim().length > 0,
    'card-number': (val) => /^\d{16}$/.test(val.replace(/\s/g, '')),
    'card-expiry': (val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val),
    'card-cvc': (val) => /^\d{3,4}$/.test(val)
};

document.getElementById('card-number').addEventListener('input', (e) => { });

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    let isValid = true;
    const data = {};

    for (const [id, validator] of Object.entries(validators)) {
        const input = document.getElementById(id);
        const val = input.value;
        if (!validator(val)) {
            isValid = false;
            input.classList.add('is-invalid');
            const errDiv = document.getElementById(`${id}-error`);
            if (errDiv) errDiv.classList.add('visible');
        }
        data[id] = val;
    }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

    const payload = {
        address: {
            streetAddress: data['addr-street'],
            city: data['addr-city'],
            province: data['addr-province'].toUpperCase(),
            zipCode: data['addr-zip']
        },
        card: {
            cardOwner: data['card-owner'],
            cardNumber: data['card-number'],
            expiryDate: data['card-expiry'],
            cvc: data['card-cvc']
        }
    };

    let response;
    try {
        response = await fetch('/api/finalize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            window.location.href = '/home';
        } else {
            const errData = await response.json();
            alert(errData.error || 'Setup failed. Please try again.');
        }
    } catch (err) {
        console.error(err);
        alert('Connection error. Please try again.');
    } finally {
        if (!response.ok) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Complete Setup';
        }
    }
});