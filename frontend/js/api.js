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
 * 
 * Core utility used by all other modules for backend communication.
 */

import { addMessage } from './errorManager.js';
import { setLoadingState } from './uiUtils.js';
import { config } from './config.js';

export async function fetchApi(url, options = {}, button = null) {
    if (button) setLoadingState(button, true);

    try {
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
        addMessage('A network or server error occurred. Please try again.');
        return null;
    } finally {
        if (button) setLoadingState(button, false);
    }
}