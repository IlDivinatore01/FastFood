/**
 * API Client Module
 * 
 * Central fetch wrapper for all API communication with the backend.
 * Handles authentication (credentials), error responses, and loading states.
 * Auto-redirects to login on 401 (session expired).
 * Detects offline state and shows appropriate error messages.
 */

import { addMessage } from './errorManager.js';
import { setLoadingState } from './uiUtils.js';
import { config } from './config.js';

const PUBLIC_PAGES = ['/login', '/register', '/landing.html', '/'];

export async function fetchApi(url, options = {}, button = null) {
    if (button) setLoadingState(button, true);

    try {
        if (!navigator.onLine) {
            addMessage('No internet connection. Please check your network.');
            return null;
        }

        const defaultHeaders = { 'Content-Type': 'application/json' };

        if (options.body instanceof FormData) {
            delete defaultHeaders['Content-Type'];
        }

        const fetchConfig = {
            credentials: 'include',
            cache: 'no-cache',
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        const res = await fetch(config.API_BASE_URL + url, fetchConfig);

        if (res.status === 401) {
            const currentPath = window.location.pathname;
            const isPublicPage = PUBLIC_PAGES.some(p => currentPath === p || currentPath.endsWith(p));

            if (!isPublicPage) {
                addMessage('Your session has expired. Please log in again.');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
                return null;
            }
        }

        if (res.status === 403) {
            addMessage('You do not have permission to perform this action.');
            return null;
        }

        if (res.status === 404) {
            const data = await res.json().catch(() => ({}));
            addMessage(data.error || 'The requested resource was not found.');
            return null;
        }

        if (res.status === 429) {
            addMessage('Too many requests. Please wait a moment and try again.');
            return null;
        }

        if (res.status >= 500) {
            addMessage('Server error. Please try again later.');
            return null;
        }

        const contentType = res.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            console.warn('Non-JSON response from', url, 'status:', res.status, 'body:', text);
            addMessage('Unexpected server response format.');
            return null;
        }

        if (!res.ok) {
            const errorMessage = Array.isArray(data.error)
                ? data.error.join('<br>')
                : (data.error || data.message || 'An unknown error occurred.');
            addMessage(errorMessage);
            return null;
        }

        return data;
    } catch (err) {
        console.error('API Fetch Error:', err);

        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
            addMessage('Unable to connect to server. Please check your connection.');
        } else if (err.name === 'AbortError') {
            addMessage('Request was cancelled.');
        } else {
            addMessage('A network or server error occurred. Please try again.');
        }
        return null;
    } finally {
        if (button) setLoadingState(button, false);
    }
}