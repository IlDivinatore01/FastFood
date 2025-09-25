/**
 * Common layout and navigation management for authenticated pages.
 * 
 * This module handles shared layout functionality including:
 * - Navigation bar rendering and user authentication status
 * - User menu and profile access controls
 * - Page routing and navigation state management
 * - Logout functionality and session management
 * - Responsive navigation for mobile and desktop
 * - Common UI elements and page structure
 * - User type-specific navigation options
 * 
 * Provides consistent navigation experience across all application pages.
 */

import { fetchApi } from './api.js';
import { showCartButton } from './cartManager.js';

function applyLayout(){
    document.body.dataset.bsTheme = 'dark'; 

    const username = localStorage.getItem('username');

    const navbar = document.createElement('nav');
    navbar.className = 'navbar navbar-expand-lg navbar-dark bg-dark mb-0 my-navbar';

    const navbarContainer = document.createElement('div');
    navbarContainer.className = 'container-fluid';

    const navbarBrand = document.createElement('a');
    navbarBrand.className = 'navbar-brand mb-0 h1';
    navbarBrand.href = '/home';
    navbarBrand.innerText = 'FastFood';

    const navbarBtns = document.createElement('div');
    navbarBtns.className = 'd-flex align-items-center gap-3'; // Increased gap

    if (username) {
        const homeBtn = document.createElement('a');
        homeBtn.className = 'btn btn-outline-light';
        homeBtn.href = '/home';
        homeBtn.innerText = 'Home';

        const profileBtn = document.createElement('a');
        profileBtn.className = 'btn btn-primary';
        profileBtn.href = '/profile';
        profileBtn.innerText = username;

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-outline-secondary';
        logoutBtn.type = 'button';
        logoutBtn.onclick = () => {
            logout()
        };
        logoutBtn.innerText = 'Logout';

        const cartBtn = document.createElement('button');
        cartBtn.id = 'cart-btn'
        cartBtn.className = 'btn btn-outline-light position-relative';
        cartBtn.type = 'button';
        cartBtn.onclick = () => { window.location.href = '/cart' };
        cartBtn.hidden = true;
        cartBtn.innerText = 'Cart';

        navbarBtns.append(homeBtn, cartBtn, profileBtn, logoutBtn);
    }

    navbarContainer.append(navbarBrand, navbarBtns);
    navbar.append(navbarContainer);

    const container = document.createElement('div');
    container.className = 'container main-container'; 

    const contentDiv = document.createElement('div');
    contentDiv.id = 'layout-content-wrapper'; 

    const row = document.createElement('div');
    row.className = 'row';

    const content = document.getElementById('content');
    if (content) {
        while (content.firstChild) {
            row.appendChild(content.firstChild);
        }
        content.remove();
    }

    contentDiv.append(row);
    container.append(contentDiv);
    document.body.prepend(container); 
    document.body.prepend(navbar); 
}

async function logout(){
    const data = await fetchApi('/auth/logout', { method: 'GET' });
    if (data) {
        localStorage.clear();
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '/register') {
        return;
    }
    applyLayout();
    showCartButton();
});