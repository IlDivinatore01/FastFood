/**
 * UI Utilities Module
 * 
 * Helper functions for loading states, form handling, formatting.
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