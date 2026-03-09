// Activity Tracker - Tracks user activity and displays statistics
import { STORAGE_KEY, MAX_EVENTS, MAX_TIMELINE_DISPLAY } from './constants.js';
import { formatDuration, formatTimestamp, getPageLabel, getPageName } from './utils.js';

class ActivityTracker {
    constructor(options = {}) {
        if (ActivityTracker.instance) return ActivityTracker.instance;

        this.storageKey = options.storageKey || STORAGE_KEY;
        this.maxEvents = options.maxEvents || MAX_EVENTS;
        this.data = this.loadSession();
        this.durationIntervalId = null;
        this.persistTimer = null;

        this.widgetElements = null;
        this.renderWidget();
        this.refreshWidget();
        this.attachEventListeners();

        this.recordEvent('pageview', getPageLabel());
        this.startSessionDurationTimer();

        ActivityTracker.instance = this;
    }

     persist() {
        if (this._persistTimer) clearTimeout(this._persistTimer);
        this._persistTimer = setTimeout(() => {
            this._persistTimer = null;
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            } catch (error) {
                console.error('Failed to persist session:', error);
            }
        });
    }

    //Session Managers
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    createSessionData() {
        return {
            sessionId: this.generateSessionId(),
            startedAt: Date.now(),
            toggleTimeline: true,
            stats: {
                pageViews: 0,
                clicks: 0,
                formSubmits: 0,
                sessionDuration: 0
            },
            events: []
        }
    }
    
    isValidSessionData(data) {
        return data && data.sessionId && data.events;
    }

    updateSessionDuration() {
        const durationMs = Math.max(0, Date.now() - this.data.startedAt);
        this.data.stats.sessionDuration = durationMs;
        this.data.stats.sessionDurationMs = durationMs;
    }

    getSessionDurationMs() {
        return this.data.stats.sessionDuration ?? this.data.stats.sessionDurationMs ?? 0;
    }
    loadSession() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if(this.isValidSessionData(parsed)){
                    return{
                        ...this.createSessionData(),
                        ...parsed,
                        events: Array.isArray(parsed.events) ? parsed.events : []
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load session from localStorage:', error);
        }
        return this.createSessionData();
    }
    
 
    recordEvent(type, details) {
        const event = {
            type,
            details,
            page: getPageName(),
            timestamp: Date.now()
        }
        this.data.events.push(event);
        
        this.data.lastActivityAt = Date.now();
        if (this.data.events.length > this.maxEvents) {
            this.data.events.shift();
        }
        if (type === 'pageview') this.data.stats.pageViews += 1;
        else if (type === 'click') this.data.stats.clicks += 1;
        else if (type === 'formSubmit') this.data.stats.formSubmits += 1;
        this.updateSessionDuration();
        this.persist();
        this.refreshStats();
        this.appendEvent();
    }

    appendEvent(event) {
        if (!this.widgetElements || !this.widgetElements.timelineList) return;
        const list = this.widgetElements.timelineList;
        if (list.firstChild && list.firstChild.textContent.trim() === 'No activity yet.') {
            list.removeChild(list.firstChild);
        }
        list.insertBefore(this.createEventItemElement(event), list.firstChild);
        while (list.children.length > MAX_TIMELINE_DISPLAY) {
            list.removeChild(list.lastChild);
        }
    }

    updateDurationDisplay() {
        if (!this.widgetElements || !this.widgetElements.sessionDuration) return;
        this.widgetElements.sessionDuration.textContent = `Duration: ${formatDuration(this.getSessionDurationMs())}`;
    }

    startSessionDurationTimer() {
        if (this.durationIntervalId) return;

        this.updateSessionDuration();
        this.updateDurationDisplay();

        this.durationIntervalId = window.setInterval(() => {
            this.updateSessionDuration();
            this.updateDurationDisplay();
        }, 1000);
    }


    /////////Widget Renderers///////////
    renderWidget() {
        if (this.widgetElements) return;

        const aside = document.createElement('aside');
        aside.className = 'activity-tracker-widget';

        const header = document.createElement('header');
        header.className = 'widget-header';
        const title = document.createElement('h3');
        title.textContent = 'Activity Tracker';
        header.appendChild(title);

     
        const stats = document.createElement('div');
        stats.className = 'widget-stats';
        const pageViews = document.createElement('span');
        const clicks = document.createElement('span');
        const formSubmits = document.createElement('span');
        const sessionDuration = document.createElement('span');
        stats.append(pageViews, clicks, formSubmits, sessionDuration);

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'toggle-timeline-btn';
        toggleBtn.textContent = 'Hide Timeline';

        const timelineWrapper = document.createElement('div');
        timelineWrapper.className = 'widget-timeline';
        const timelineList = document.createElement('ul');
        timelineWrapper.appendChild(timelineList);

        aside.append(header, stats, toggleBtn, timelineWrapper);
        document.body.appendChild(aside);
        this.widgetElements = {
            aside,
            toggleBtn,
            pageViews,
            clicks,
            formSubmits,
            sessionDuration,
            timelineWrapper,
            timelineList
        };
    }
    refreshWidget() {
        if (!this.widgetElements.timelineList) return;
        
        this.widgetElements.pageViews.textContent = `Pages: ${this.data.stats.pageViews}`;
        this.widgetElements.clicks.textContent = `Clicks: ${this.data.stats.clicks}`;
        this.widgetElements.formSubmits.textContent = `Forms: ${this.data.stats.formSubmits}`;
        this.widgetElements.timelineWrapper.hidden = !this.data.toggleTimeline;
        this.updateDurationDisplay();
        this.widgetElements.toggleBtn.textContent = this.data.toggleTimeline ? 'Hide Timeline' : 'Show Timeline';
        this.widgetElements.toggleBtn.setAttribute('aria-expanded', String(this.data.toggleTimeline));

        //use DocumentFragment for batch insert — avoids repeated reflows
        const fragment = document.createDocumentFragment();
        const events = this.data.events.slice().reverse().slice(0, MAX_TIMELINE_DISPLAY);
        events.forEach(event => fragment.appendChild(this.createEventItemElement(event)));
        
        this.widgetElements.timelineList.replaceChildren(fragment);

        if (events.length === 0) {
            const empty = document.createElement('li');
            empty.textContent = 'No activity yet.';
            this.widgetElements.timelineList.appendChild(empty);
        }
    }

    refreshStats() {
        if (!this.widgetElements) return;
        this.widgetElements.pageViews.textContent = `Pages: ${this.data.stats.pageViews}`;
        this.widgetElements.clicks.textContent = `Clicks: ${this.data.stats.clicks}`;
        this.widgetElements.formSubmits.textContent = `Forms: ${this.data.stats.formSubmits}`;
        this.updateDurationDisplay();
    }

    createEventItemElement(event) {
        const li = document.createElement('li');
        li.className = 'activity-tracker-event';

        const time = document.createElement('span');
        time.className = 'event-time';
        time.textContent = formatTimestamp(event.timestamp);

        const type = document.createElement('span');
        type.className = 'event-type';
        type.textContent = event.type;

        const details = document.createElement('span');
        details.className = 'event-details';
        details.textContent = event.details || '';

        const page = document.createElement('span');
        page.className = 'event-page';
        page.textContent = event.page || '';

        li.append(type, details, time);
        return li;
    }

    
    
    /////////Event Handlers////////

    attachEventListeners() {
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('submit', this.handleDocumentSubmit);
        this.widgetElements.toggleBtn.addEventListener('click', this.handleToggleTimeline);
    }

    isWidgetElement(target) {
        return this.widgetElements.aside.contains(target);
    }

    getClickTargetLabel(target) {
        if (!target || !target.closest) return null;
        const element = target.closest('button, a, select, [role="button"], [data-track-click]');
        if (!element) return null;

        const text = (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        const label = element.id || text || element.tagName.toLowerCase();
        const tag = element.tagName.toLowerCase();
        
        // Special handling for select elements to show selected value
        if (tag === 'select') {
            const selectedOption = element.options[element.selectedIndex];
            const selectedText = selectedOption ? selectedOption.text : null;
            if (selectedText) {
                return `User clicked "${label}" select and selected "${selectedText}"`;
            }
        }
        return `User clicked "${label}"`;
    }

    handleDocumentClick = (e) => {
        if (this.isWidgetElement(e.target)) return;
        const label = this.getClickTargetLabel(e.target);
        if (!label) return;
        this.recordEvent('click', label);
    }
    
    handleDocumentSubmit = (e) => {
        if (this.isWidgetElement(e.target)) return;
        const form = e.target;
        const formLabel = form.id || form.name || 'unnamed form';
        this.recordEvent('formSubmit', `User submitted form "${formLabel}"`);
    }
    
    handleToggleTimeline = (e) => {
        this.data.toggleTimeline = !this.data.toggleTimeline;
        this.persist();
        this.refreshWidget();
    }
  
}

document.addEventListener('DOMContentLoaded', () => {
        window.__activityTrackerInstance = new ActivityTracker();
});