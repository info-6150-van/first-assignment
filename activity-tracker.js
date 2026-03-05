const STORAGE_KEY = 'activity-tracker-data';
const MAX_EVENTS = 100;

class ActivityTracker {
    constructor(options = {}) {
        if (ActivityTracker.instance) return ActivityTracker.instance;

        this.storageKey = options.storageKey || STORAGE_KEY;
        this.maxEvents = options.maxEvents || MAX_EVENTS;
        this.data = this.loadSession();

        this.widgetElements = null;
        this.renderWidget();
        this.attachEventListeners();

        this.recordEvent('pageview', this.getPageLabel());

        ActivityTracker.instance = this;
    }

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
                formSubmits: 0
            },
            events: []
        }
    }
    
    isValidSessionData(data) {
        return data && data.sessionId && data.events;
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
    
    persist() {
        try{
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error){
            console.error('Failed to persist session:', error);
        }
    }

    recordEvent(type, details) {
        this.data.events.push({
            type,
            details,
            timestamp: Date.now()
        });
        
        this.data.lastActivityAt = Date.now();
        if (this.data.events.length > this.maxEvents) {
            this.data.events.shift();
        }
        if (type === 'pageview') this.data.stats.pageViews += 1;
        else if (type === 'click') this.data.stats.clicks += 1;
        else if (type === 'formSubmit') this.data.stats.formSubmits += 1;
        this.persist();
        this.refreshWidget();
    }

     getPageLabel() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

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

    createEventItemElement(event) {
        const li = document.createElement('li');
        li.className = 'activity-tracker-event';


        const type = document.createElement('span');
        type.className = 'event-type';
        type.textContent = event.type;

        const details = document.createElement('span');
        details.className = 'event-details';
        details.textContent = event.details || '';

        const page = document.createElement('span');
        page.className = 'event-page';
        page.textContent = event.page || '';

        li.append(type, details, page);
        return li;
    }

    attachEventListeners() {
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('submit', this.handleDocumentSubmit);
        this.widgetElements.toggleBtn.addEventListener('click', this.handleToggleTimeline);
    }
    isWidgetElement(target) {
        return Object.values(this.widgetElements).some(element => element && element.contains(target));
    }
    getClickTargetLabel(target) {
        if (!target || !target.closest) return null;

        const element = target.closest('button, a, select, [role="button"], [data-track-click]');
        if (!element) return null;

        const text = (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        const id = element.id ? `#${element.id}` : '';
        const tag = element.tagName.toLowerCase();
        return text ? `${tag}${id} (${text})` : `${tag}${id}`;
    }
    
    
    //callbacks
    handleDocumentClick = (e) => {
        if (this.isWidgetElement(e.target)) return;
        const label = this.getClickTargetLabel(e.target);
        if (!label) return;
        this.recordEvent('click', label);
    }
    
    handleDocumentSubmit = (e) => {
        if (this.isWidgetElement(e.target)) return;
        const form = e.target;
        this.recordEvent('formSubmit', `form: ${form.id}`);
    }
    
    handleToggleTimeline = (e) => {
        this.data.toggleTimeline = !this.data.toggleTimeline;
        this.persist();
        this.refreshWidget();
    }
  
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}