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

function applyLayout() {
    document.body.dataset.bsTheme = 'dark';

    const username = localStorage.getItem('username');

    // Create Navbar
    const navbar = document.createElement('nav');
    navbar.className = 'navbar navbar-expand-lg navbar-dark bg-dark mb-0 my-navbar';

    const navbarContainer = document.createElement('div');
    navbarContainer.className = 'container-fluid';

    // Brand
    const navbarBrand = document.createElement('a');
    navbarBrand.className = 'navbar-brand mb-0 h1 fs-2 fw-bold'; // Added fs-2 to match Landing
    navbarBrand.href = '/home';
    navbarBrand.innerText = 'FastFood';

    navbarContainer.appendChild(navbarBrand);

    if (username) {
        // Toggler Button
        const togglerBtn = document.createElement('button');
        togglerBtn.className = 'navbar-toggler border-0';
        togglerBtn.type = 'button';
        togglerBtn.setAttribute('data-bs-toggle', 'collapse');
        togglerBtn.setAttribute('data-bs-target', '#navbarContent');
        togglerBtn.setAttribute('aria-controls', 'navbarContent');
        togglerBtn.setAttribute('aria-expanded', 'false');
        togglerBtn.setAttribute('aria-label', 'Toggle navigation');

        const togglerIcon = document.createElement('span');
        togglerIcon.className = 'navbar-toggler-icon';
        togglerBtn.appendChild(togglerIcon);

        navbarContainer.appendChild(togglerBtn);

        // Collapsible Content
        const collapseDiv = document.createElement('div');
        collapseDiv.className = 'collapse navbar-collapse justify-content-end';
        collapseDiv.id = 'navbarContent';

        const navbarNav = document.createElement('ul');
        navbarNav.className = 'navbar-nav align-items-center gap-2 mt-3 mt-lg-0';

        // Home Link
        const navItemHome = document.createElement('li');
        navItemHome.className = 'nav-item';
        const homeBtn = document.createElement('a');
        homeBtn.className = 'nav-link';
        homeBtn.href = '/home';
        homeBtn.innerText = 'Home';
        navItemHome.appendChild(homeBtn);

        // Cart Button
        const navItemCart = document.createElement('li');
        navItemCart.className = 'nav-item';
        const cartBtn = document.createElement('a'); // Changed to link for better nav styling
        cartBtn.id = 'cart-btn';
        cartBtn.className = 'nav-link position-relative';
        cartBtn.href = '/cart';
        cartBtn.hidden = true;
        cartBtn.innerHTML = '<i class="bi bi-cart3"></i> Cart';
        navItemCart.appendChild(cartBtn);

        // Profile Button
        const navItemProfile = document.createElement('li');
        navItemProfile.className = 'nav-item';
        const profileBtn = document.createElement('a');
        profileBtn.className = 'btn btn-primary d-flex align-items-center gap-2 px-3';
        profileBtn.href = '/profile';
        profileBtn.innerHTML = `<i class="bi bi-person-circle"></i> ${username}`;
        navItemProfile.appendChild(profileBtn);

        // Logout Button
        const navItemLogout = document.createElement('li');
        navItemLogout.className = 'nav-item';
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-outline-danger d-flex align-items-center gap-2';
        logoutBtn.type = 'button';
        logoutBtn.onclick = () => { logout() };
        logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Logout';
        navItemLogout.appendChild(logoutBtn);

        navbarNav.append(navItemHome, navItemCart, navItemProfile, navItemLogout);
        collapseDiv.appendChild(navbarNav);
        navbarContainer.appendChild(collapseDiv);
    }

    navbar.appendChild(navbarContainer);

    // Main Container
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

async function logout() {
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