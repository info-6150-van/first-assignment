/**
 * ActivityTracker - User Activity Tracking Widget
 * 
 * Tracks user interactions across multiple pages and displays them in a timeline.
 * Persists data using localStorage with session management.
 * 
 * @class ActivityTracker
 */
class ActivityTracker {
    constructor() {
        this.storageKey = 'activity-tracker-data';
        this.sessionTimeout = 60 * 60 * 1000; // 1 hour in milliseconds
        
        // Initialize or load session
        this.initializeSession();
        
        // Render the widget
        this.renderWidget();
        
        // Start tracking
        this.startTracking();
        
        // Update stats periodically
        this.startStatsUpdater();
    }

    /**
     * Initialize or load existing session from localStorage
     */
    initializeSession() {
        const stored = localStorage.getItem(this.storageKey);
        const now = Date.now();
        
        if (stored) {
            const data = JSON.parse(stored);
            const lastActivity = new Date(data.lastActivity).getTime();
            
            // Check if session expired (1 hour of inactivity)
            if (now - lastActivity < this.sessionTimeout) {
                // Resume existing session
                this.sessionData = data;
                this.sessionData.lastActivity = new Date().toISOString();
            } else {
                // Create new session (expired)
                this.createNewSession();
            }
        } else {
            // Create new session (first time)
            this.createNewSession();
        }
        
        // Track page view for current page
        this.trackPageView();
        
        // Save updated session
        this.saveSession();
    }

    /**
     * Create a new session with unique ID
     */
    createNewSession() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        
        this.sessionData = {
            sessionId: `session_${timestamp}_${random}`,
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            activities: [],
            stats: {
                pagesViewed: 0,
                totalClicks: 0,
                formsSubmitted: 0
            }
        };
    }

    /**
     * Save session data to localStorage
     */
    saveSession() {
        this.sessionData.lastActivity = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(this.sessionData));
    }

    /**
     * Track a page view event
     */
    trackPageView() {
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        const scrollPercentage = 0; // Initial scroll is 0%
        
        const activity = {
            type: 'pageview',
            timestamp: new Date().toISOString(),
            details: {
                page: pageName,
                scrollPercentage: scrollPercentage
            }
        };
        
        this.sessionData.activities.push(activity);
        this.sessionData.stats.pagesViewed++;
        this.saveSession();
    }

    /**
     * Track a click event
     */
    trackClick(elementText) {
        const activity = {
            type: 'interaction',
            timestamp: new Date().toISOString(),
            details: {
                action: 'click',
                element: elementText
            }
        };
        
        this.sessionData.activities.push(activity);
        this.sessionData.stats.totalClicks++;
        this.saveSession();
        
        // Update timeline if widget is rendered
        if (this.widgetElement) {
            this.updateTimeline();
            this.updateStats();
        }
    }

    /**
     * Track a form submission event
     */
    trackFormSubmit(formId) {
        const activity = {
            type: 'interaction',
            timestamp: new Date().toISOString(),
            details: {
                action: 'submit',
                form: formId
            }
        };
        
        this.sessionData.activities.push(activity);
        this.sessionData.stats.formsSubmitted++;
        this.saveSession();
        
        // Update timeline if widget is rendered
        if (this.widgetElement) {
            this.updateTimeline();
            this.updateStats();
        }
    }

    /**
     * Start tracking user interactions
     */
    startTracking() {
        // Track clicks on buttons with class 'btn-primary'
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.btn-primary');
            if (target) {
                const buttonText = target.textContent.trim();
                this.trackClick(buttonText);
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const formId = e.target.id || 'unknown-form';
            this.trackFormSubmit(formId);
        });

        // Track scroll for current page view
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateScrollPercentage();
            }, 500);
        });
    }

    /**
     * Update scroll percentage for current page view
     */
    updateScrollPercentage() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const percentage = scrollHeight > 0 ? Math.round((scrolled / scrollHeight) * 100) : 0;
        
        // Update the most recent page view activity
        const activities = this.sessionData.activities;
        for (let i = activities.length - 1; i >= 0; i--) {
            if (activities[i].type === 'pageview') {
                activities[i].details.scrollPercentage = percentage;
                this.saveSession();
                
                // Update timeline display if open
                if (this.widgetElement && this.timelineElement.classList.contains('expanded')) {
                    this.updateTimeline();
                }
                break;
            }
        }
    }

    /**
     * Render the activity tracker widget
     */
    renderWidget() {
        // Create main widget container
        this.widgetElement = document.createElement('div');
        this.widgetElement.className = 'activity-tracker-widget';
        
        // Create toggle button
        const button = document.createElement('button');
        button.className = 'activity-tracker-button';
        button.innerHTML = '🕦';
        button.setAttribute('aria-label', 'Toggle Activity Timeline');
        
        // Create timeline panel
        this.timelineElement = document.createElement('aside');
        this.timelineElement.className = 'activity-tracker-timeline';
        this.timelineElement.setAttribute('aria-label', 'Activity Timeline');
        
        // Build timeline structure
        this.timelineElement.innerHTML = this.buildTimelineHTML();
        
        // Add toggle functionality
        button.addEventListener('click', () => {
            this.timelineElement.classList.toggle('expanded');
            if (this.timelineElement.classList.contains('expanded')) {
                this.updateTimeline();
                this.updateStats();
            }
        });
        
        // Add close button functionality
        const closeButton = this.timelineElement.querySelector('.timeline-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.timelineElement.classList.remove('expanded');
            });
        }
        
        // Append to widget
        this.widgetElement.appendChild(button);
        this.widgetElement.appendChild(this.timelineElement);
        
        // Append to body
        document.body.appendChild(this.widgetElement);
    }

    /**
     * Build the timeline HTML structure
     */
    buildTimelineHTML() {
        const startTime = new Date(this.sessionData.startTime);
        const formattedStartTime = this.formatTime(startTime);
        
        return `
            <header class="timeline-header">
                <h3>Activity Timeline</h3>
                <div>
                    <div>Session ID: ${this.sessionData.sessionId}</div>
                    <div>Started: ${formattedStartTime}</div>
                </div>
                <button class="timeline-close-button" aria-label="Close Timeline">×</button>
            </header>
            
            <section class="session-stats">
                <div class="stat">
                    <span class="stat-label">Session Duration</span>
                    <span class="stat-value" id="stat-duration">0 min</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Pages Viewed</span>
                    <span class="stat-value" id="stat-pages">${this.sessionData.stats.pagesViewed}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Clicks</span>
                    <span class="stat-value" id="stat-clicks">${this.sessionData.stats.totalClicks}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Forms Submitted</span>
                    <span class="stat-value" id="stat-forms">${this.sessionData.stats.formsSubmitted}</span>
                </div>
            </section>
            
            <div class="timeline-content">
                <div class="timeline-wrapper" id="timeline-activities">
                    ${this.buildActivitiesHTML()}
                </div>
            </div>
        `;
    }

    /**
     * Build HTML for all activities
     */
    buildActivitiesHTML() {
        if (this.sessionData.activities.length === 0) {
            return '<div class="timeline-empty">No activities yet</div>';
        }
        
        // Reverse order to show most recent first
        const activities = [...this.sessionData.activities].reverse();
        
        return activities.map(activity => {
            const time = new Date(activity.timestamp);
            const formattedTime = this.formatTime(time);
            
            if (activity.type === 'pageview') {
                return `
                    <div class="timeline-item pageview">
                        <div class="time">${formattedTime}</div>
                        <div class="event-title">Page View</div>
                        <div class="event-details">Visited: ${activity.details.page} — ${activity.details.scrollPercentage}% viewed</div>
                    </div>
                `;
            } else if (activity.type === 'interaction') {
                if (activity.details.action === 'click') {
                    return `
                        <div class="timeline-item interaction">
                            <div class="time">${formattedTime}</div>
                            <div class="event-title">Interaction</div>
                            <div class="event-details">Clicked link: ${activity.details.element}</div>
                        </div>
                    `;
                } else if (activity.details.action === 'submit') {
                    return `
                        <div class="timeline-item interaction">
                            <div class="time">${formattedTime}</div>
                            <div class="event-title">Interaction</div>
                            <div class="event-details">Submitted form: ${activity.details.form}</div>
                        </div>
                    `;
                }
            }
            
            return '';
        }).join('');
    }

    /**
     * Update the timeline activities display
     */
    updateTimeline() {
        const timelineActivities = document.getElementById('timeline-activities');
        if (timelineActivities) {
            timelineActivities.innerHTML = this.buildActivitiesHTML();
        }
    }

    /**
     * Update the statistics display
     */
    updateStats() {
        // Update pages viewed
        const pagesElement = document.getElementById('stat-pages');
        if (pagesElement) {
            pagesElement.textContent = this.sessionData.stats.pagesViewed;
        }
        
        // Update total clicks
        const clicksElement = document.getElementById('stat-clicks');
        if (clicksElement) {
            clicksElement.textContent = this.sessionData.stats.totalClicks;
        }
        
        // Update forms submitted
        const formsElement = document.getElementById('stat-forms');
        if (formsElement) {
            formsElement.textContent = this.sessionData.stats.formsSubmitted;
        }
        
        // Update session duration
        this.updateSessionDuration();
    }

    /**
     * Update session duration display
     */
    updateSessionDuration() {
        const durationElement = document.getElementById('stat-duration');
        if (durationElement) {
            const startTime = new Date(this.sessionData.startTime).getTime();
            const now = Date.now();
            const durationMinutes = Math.floor((now - startTime) / (1000 * 60));
            durationElement.textContent = `${durationMinutes} min`;
        }
    }

    /**
     * Start periodic stats updater
     */
    startStatsUpdater() {
        // Update duration every 30 seconds
        setInterval(() => {
            if (this.timelineElement && this.timelineElement.classList.contains('expanded')) {
                this.updateSessionDuration();
            }
        }, 30000);
    }

    /**
     * Format time to HH:MM:SS
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.activityTracker = new ActivityTracker();
    });
} else {
    // DOM already loaded
    window.activityTracker = new ActivityTracker();
}