/**
 * Reusable UI component library for consistent interface elements.
 * 
 * This module provides standardized UI components including:
 * - Card components for restaurants, dishes, and content display
 * - Pagination controls for large data sets
 * - Modal dialogs and confirmation interfaces
 * - Form controls and input validation helpers
 * - Loading indicators and progress elements
 * - Bootstrap-compatible styling and responsive design
 * - Event handling and interaction management
 * 
 * Ensures visual consistency and reduces code duplication across pages.
 */

/**
 * Creates a generic card component.
 * @param {object} options - The options for the card.
 * @param {string} options.imageSrc - The source for the card image.
 * @param {string} options.title - The title text for the card.
 * @param {string} [options.bodyText] - The body text for the card.
 * @param {function} [options.onClick] - The function to call when the card is clicked.
 * @param {string} [options.colClass='col-3 my-2'] - The bootstrap column class.
 * @returns {HTMLElement} The card element.
 */
export function createCard({ imageSrc, title, bodyText, onClick, colClass = 'col-12 col-md-6 col-lg-4 col-xl-3' }) {
    const col = document.createElement('div');
    col.className = colClass;

    const card = document.createElement('div');
    card.className = 'card h-100';
    if (onClick) {
        card.style.cursor = 'pointer';
        card.onclick = onClick;
    }

    const cardImg = document.createElement('img');
    cardImg.className = 'card-img-top image-clip';
    cardImg.src = imageSrc;
    cardImg.alt = `Image of ${title}`;
    cardImg.loading = 'lazy';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column';

    const cardTitle = document.createElement('h5');
    cardTitle.className = 'card-title';
    cardTitle.innerText = title;

    cardBody.appendChild(cardTitle);

    if (bodyText) {
        const cardText = document.createElement('p');
        cardText.className = 'card-text text-body-secondary mt-auto'; // Pushes text to bottom
        cardText.innerText = bodyText;
        cardBody.appendChild(cardText);
    }

    card.append(cardImg, cardBody);
    col.append(card);

    return col;
}

/**
 * Renders a pagination component.
 * @param {HTMLElement} container - The container to render the pagination into.
 * @param {object} state - The pagination state.
 * @param {number} state.currentPage - The current active page.
 * @param {number} state.maxPage - The total number of pages.
 * @param {function} state.onPageChange - The callback function to execute when a page is changed.
 * @returns {HTMLElement} The container element with the pagination component.
 */
export function renderPagination(container, { currentPage, maxPage, onPageChange }) {
    container.innerHTML = '';
    if (maxPage <= 1) {
        container.hidden = true;
        return container;
    }
    container.hidden = false;

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    const firstLi = document.createElement('li');
    firstLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const firstA = document.createElement('a');
    firstA.className = 'page-link';
    firstA.href = '#';
    firstA.innerText = 'First';
    firstA.onclick = (e) => { e.preventDefault(); onPageChange(1); };
    firstLi.appendChild(firstA);

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevA = document.createElement('a');
    prevA.className = 'page-link';
    prevA.href = '#';
    prevA.innerText = 'Previous';
    prevA.onclick = (e) => { e.preventDefault(); onPageChange(currentPage - 1); };
    prevLi.appendChild(prevA);

    ul.append(firstLi, prevLi);

    for (let i = 1; i <= maxPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const pageA = document.createElement('a');
        pageA.className = 'page-link';
        pageA.href = '#';
        pageA.innerText = i;
        pageA.onclick = (e) => { e.preventDefault(); onPageChange(i); };
        pageLi.appendChild(pageA);
        ul.appendChild(pageLi);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === maxPage ? 'disabled' : ''}`;
    const nextA = document.createElement('a');
    nextA.className = 'page-link';
    nextA.href = '#';
    nextA.innerText = 'Next';
    nextA.onclick = (e) => { e.preventDefault(); onPageChange(currentPage + 1); };
    nextLi.appendChild(nextA);

    const lastLi = document.createElement('li');
    lastLi.className = `page-item ${currentPage === maxPage ? 'disabled' : ''}`;
    const lastA = document.createElement('a');
    lastA.className = 'page-link';
    lastA.href = '#';
    lastA.innerText = 'Last';
    lastA.onclick = (e) => { e.preventDefault(); onPageChange(maxPage); };
    lastLi.appendChild(lastA);

    ul.append(nextLi, lastLi);

    container.appendChild(ul);
    return container;
}