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
 * Get the current page name from URL
 * @returns {string} Page name only
 */
export function getPageName() {
    return window.location.pathname.split('/').pop() || 'index.html';
}

/**
 * Get descriptive page label for pageview events
 * @returns {string} Descriptive page label
 */
export function getPageLabel() {
    return `User viewed page "${getPageName()}"`;
}
