/**
 * Central API communication module for all HTTP requests to the backend.
 * 
 * This module provides a unified interface for API communication with:
 * - Standardized fetch wrapper with error handling and loading states
 * - Automatic credential management for authentication
 * - Content-type handling for JSON and FormData requests
 * - Response validation and error message extraction
 * - Network error handling and user feedback
 * - Loading state management for UI buttons and forms
 * - Cache control and request optimization
 * - Auto-redirect to login on 401 (session expired)
 * - Offline detection with user-friendly message
 * 
 * Core utility used by all other modules for backend communication.
 */

import { addMessage } from './errorManager.js';
import { setLoadingState } from './uiUtils.js';
import { config } from './config.js';

// Pages that don't require authentication (no redirect on 401)
const PUBLIC_PAGES = ['/login', '/register', '/landing.html', '/'];

export async function fetchApi(url, options = {}, button = null) {
    if (button) setLoadingState(button, true);

    try {
        // Check if offline
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

        // Handle 401 Unauthorized - session expired
        if (res.status === 401) {
            const currentPath = window.location.pathname;
            const isPublicPage = PUBLIC_PAGES.some(p => currentPath === p || currentPath.endsWith(p));

            if (!isPublicPage) {
                addMessage('Your session has expired. Please log in again.');
                // Small delay so user sees the message
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
                return null;
            }
        }

        // Handle 403 Forbidden
        if (res.status === 403) {
            addMessage('You do not have permission to perform this action.');
            return null;
        }

        // Handle 404 Not Found
        if (res.status === 404) {
            const data = await res.json().catch(() => ({}));
            addMessage(data.error || 'The requested resource was not found.');
            return null;
        }

        // Handle 429 Too Many Requests
        if (res.status === 429) {
            addMessage('Too many requests. Please wait a moment and try again.');
            return null;
        }

        // Handle 500+ Server Errors
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

        // More specific error messages
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