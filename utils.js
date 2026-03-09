// Utility functions for formatting and data extraction

/**
 * Format duration in milliseconds to HH:MM:SS
 * @param {number} time 
 * @returns {string}
 */
export function formatDuration(time) {
    const totalSeconds = Math.floor(time / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Format timestamp to locale string
 * @param {number} time 
 * @returns {string}
 */
export function formatTimestamp(time) {
    try {
        return new Date(time).toLocaleString();
    } catch (_) {
        return 'Invalid date';
    }
}

/**
 * Get page label from current URL
 * @returns {string} Page label
 */
export function getPageLabel() {
    return window.location.pathname.split('/').pop() || 'index.html';
}
