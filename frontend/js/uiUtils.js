/**
 * User interface utility functions for common UI operations.
 * 
 * This module provides helper functions for:
 * - Loading state management for buttons and forms
 * - Element visibility and display control
 * - Form validation and input handling
 * - CSS class management and styling utilities
 * - DOM manipulation helpers and shortcuts
 * - Animation and transition effects
 * - Responsive design utilities and breakpoint handling
 * 
 * Collection of utility functions that enhance user interface interactions.
 */

export function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading...
        `;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Submit';
    }
}

export function validateInput(inputElement) {
    if (inputElement.checkValidity()) {
        inputElement.classList.remove('is-invalid');
    } else {
        inputElement.classList.add('is-invalid');
    }
}