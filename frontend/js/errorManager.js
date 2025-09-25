/**
 * Centralized error handling and user notification system.
 * 
 * This module manages application-wide error display with:
 * - Toast notification system for user feedback
 * - Error message formatting and display
 * - Success message handling and confirmation
 * - Validation error presentation
 * - Network error handling and retry mechanisms
 * - User-friendly error message translation
 * - Notification timing and auto-dismissal
 * 
 * Provides consistent and user-friendly error communication throughout the application.
 */

let notificationToast = initToast();

function showToast(isError) {
    const toastHeader = notificationToast.toastEl.querySelector('.toast-header');
    if (isError) {
        toastHeader.classList.remove('bg-success', 'text-white');
        toastHeader.classList.add('bg-danger', 'text-white');
        notificationToast.title.innerText = 'Error!';
    } else {
        toastHeader.classList.remove('bg-danger', 'text-white');
        toastHeader.classList.add('bg-success', 'text-white');
        notificationToast.title.innerText = 'Success!';
    }
    notificationToast.text.innerHTML = notificationToast.messages.join('<br>');
    notificationToast.toast.show();
    notificationToast.messages = [];
}

function initToast() {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';

    const toast = document.createElement('div');
    toast.role = 'alert';
    toast.className = 'toast';
    toast.id = 'notificationToast';

    const toastHeader = document.createElement('div');
    toastHeader.className = 'toast-header';

    const title = document.createElement('strong');
    title.className = 'me-auto';
    title.innerText = 'Notification';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close';
    close.dataset.bsDismiss = 'toast';

    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';

    toastHeader.append(title, close);
    toast.append(toastHeader, toastBody);
    toastContainer.appendChild(toast);
    document.body.append(toastContainer);

    const bsToast = bootstrap.Toast.getOrCreateInstance(toast);

    return { toast: bsToast, text: toastBody, messages: [], toastEl: toast, title: title };
}

export function addMessage(message, isError = true) {
    notificationToast.messages.push(message);
    showToast(isError);
}