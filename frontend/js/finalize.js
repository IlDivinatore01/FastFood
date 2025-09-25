/**
 * Customer profile setup completion for new user onboarding.
 * 
 * This module finalizes customer onboarding with:
 * - Additional customer information collection
 * - Delivery preferences and address setup
 * - Payment method configuration and validation
 * - Notification preferences and communication settings
 * - Account setup completion confirmation
 * - Welcome process and platform introduction
 * - Redirection to main application interface
 * 
 * Completes the customer journey ensuring optimal user experience setup.
 */

import { fetchApi } from './api.js';
import { validateInput } from './uiUtils.js';
import { addMessage } from './errorManager.js';

window.onload = () => {
    document.getElementById('finalize-btn').addEventListener('click', finalizeSetup);
    document.querySelectorAll('#content input').forEach(input => {
        input.addEventListener('input', () => validateInput(input));
    });
};

async function finalizeSetup() {
    const inputs = {
        streetAddress: document.getElementById('streetaddress'),
        city: document.getElementById('city'),
        province: document.getElementById('province'),
        zipCode: document.getElementById('zip'),
        cardOwner: document.getElementById('cardowner'),
        cardNumber: document.getElementById('number'),
        expiryDate: document.getElementById('expiry'),
        cvc: document.getElementById('cvc')
    };

    let allValid = true;
    for (const key in inputs) {
        validateInput(inputs[key]);
        if (!inputs[key].checkValidity()) {
            allValid = false;
        }
    }

    if (!allValid) {
        addMessage('Please fix the errors before submitting.');
        return;
    }

    const address = {
        streetAddress: inputs.streetAddress.value,
        city: inputs.city.value,
        province: inputs.province.value,
        zipCode: inputs.zipCode.value,
    };

    const card = {
        cardOwner: inputs.cardOwner.value,
        cardNumber: inputs.cardNumber.value,
        expiryDate: inputs.expiryDate.value,
        cvc: inputs.cvc.value
    };

    const data = await fetchApi('/api/finalize', {
        method: 'POST',
        body: JSON.stringify({ address, card }),
    });

    if (data) {
        window.location.href = '/home';
    }
}