/**
 * Index Script
 * 
 * Entry point: checks auth and redirects to login or home.
 */


import { fetchApi } from './api.js';

(async () => {
    const data = await fetchApi('/auth/check');
    if (data?.ok) {
        window.location.href = '/home';
    } else {
        window.location.href = '/login';
    }
})();