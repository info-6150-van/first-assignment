const STORAGE_KEY = 'activity-tracker-data';
const MAX_EVENTS = 100;
const MAX_TIMELINE_DISPLAY = 20;

class ActivityTracker {
    // IMPLEMENT YOUR CODE HERE
    constructor(options = {}) {
        this.storage_key;
        this.max_events;
        this.data;
        this.widgetElements;
    }
    generateSessionId() {}
    loadOrCreateSession() {}
    persist() {}
    updateSessionDuration() {}
    recordEvent(type, details) {}

    getPageLabel(){}
    formatDuration(ms) {}
    formatTimestamp(ts) {}

    renderWidget() {}
    refreshWidget() {}
    createEventItemElement() {}

    attachEventListeners() {}
    isWidgetElement(target) {}     
    getClickTargetLabel(target) {}
    handleDocumentClick(e) {}
    handleDocumentSubmit(e) {}
    handleToggleTimeline() {}
  
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}

export default ActivityTracker;