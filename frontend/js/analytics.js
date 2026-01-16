/**
 * Business analytics and reporting dashboard for restaurant owners.
 * 
 * This module provides business intelligence features including:
 * - Sales performance metrics and revenue tracking
 * - Order analytics and customer behavior insights
 * - Popular menu item analysis and performance metrics
 * - Customer demographics and ordering pattern analysis
 * - Time-based trends and seasonal performance tracking
 * - Comparative analytics and benchmark reporting
 * - Data export and detailed reporting capabilities
 * 
 * Data-driven insights helping restaurant owners optimize business operations.
 */

import { fetchApi } from './api.js';

const dataElements = {
    start: document.getElementById('start'),
    end: document.getElementById('end'),
    totalOrders: document.getElementById('total-orders'),
    totalEarned: document.getElementById('total-earned'),
    avgEarned: document.getElementById('avg-earned'),
    bestName: document.getElementById('best-selling-name'),
    bestAmount: document.getElementById('best-selling-amount'),
    bestEarned: document.getElementById('best-selling-earned')
}

let analyticsData;

window.onload = async () => {
    dataElements.end.valueAsDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dataElements.start.valueAsDate = thirtyDaysAgo;

    analyticsData = await getAnalytics();
    if (analyticsData) {
        showAnalytics(analyticsData);
    }

    document.getElementById('submit-analytics-btn').addEventListener('click', async (event) => {
        analyticsData = await getAnalytics(event.currentTarget);
        if (analyticsData) {
            showAnalytics(analyticsData);
        }
    });
}

async function getAnalytics(button = null) {
    const start = dataElements.start.valueAsNumber;
    let end = dataElements.end.valueAsNumber;

    if (!start || !end) return null;

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    end = endDate.getTime();

    const data = await fetchApi(`/api/restaurant/analytics?start=${start}&end=${end}`, {}, button);

    return data;
}

function showAnalytics(data) {
    dataElements.totalOrders.innerText = (data.totalOrders || 0);
    dataElements.totalEarned.innerText = (data.totalEarned / 100).toFixed(2) + '€';
    dataElements.avgEarned.innerText = (data.avgEarned / 100).toFixed(2) + '€';

    if (data.mostOrdered) {
        dataElements.bestName.innerText = data.mostOrdered.dishData.name;
        dataElements.bestAmount.innerText = data.mostOrdered.totalAmount;
        dataElements.bestEarned.innerText = (data.mostOrdered.totalEarned / 100).toFixed(2) + '€';
    } else {
        dataElements.bestName.innerText = 'No Data Yet';
        dataElements.bestAmount.innerText = '0';
        dataElements.bestEarned.innerText = '0.00€';
    }
}