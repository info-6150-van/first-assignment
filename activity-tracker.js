class ActivityTracker {
    constructor() {
        this.data = this.loadData()
        this.render()
        this.trackPageView()
        this.attachListeners()
    }

    loadData() {
        var existingData = localStorage.getItem('activity-tracker-data')
        if (existingData) {
            return JSON.parse(existingData);
        }
        var newSession = {
            sessionId: 'session_' + Date.now(),
            startedAt: Date.now(),
            events: []
        };
        return newSession;
    }

    saveData() {
        localStorage.setItem('activity-tracker-data', JSON.stringify(this.data));
    }

    trackPageView() {
        var pageEvent = {
            type: 'pageview',
            page: window.location.pathname,
            time: Date.now()
        };
        this.data.events.push(pageEvent);
        this.saveData();
    }

    trackFormSubmit(form) {
        var formEvent = {
            type: 'formsubmit',
            details: form.id ? form.id : 'form',
            time: Date.now()
        };
        this.data.events.push(formEvent);
        this.saveData();
        this.updateStats();
        this.renderTimeline();
    }

    clearData() {
        localStorage.removeItem('activity-tracker-data');
        this.data = {
            sessionId: 'session_' + Date.now(),
            startedAt: Date.now(),
            events: []
        };
        this.saveData()
        this.updateStats()
        this.renderTimeline()
    }

    render() {
        var widget = document.createElement('div')
        widget.id = 'activity-tracker-widget';

        var header = document.createElement('div')
        header.id = 'at-header';

        var title = document.createElement('span');
        title.textContent = 'Activity Tracker';

        var toggleBtn = document.createElement('button')
        toggleBtn.id = 'at-toggle';
        toggleBtn.textContent = 'Hide';

        var clearBtn = document.createElement('button')
        clearBtn.id = 'at-clear';
        clearBtn.textContent = 'Clear';

        header.appendChild(title)
        header.appendChild(toggleBtn)
        header.appendChild(clearBtn)

        var body = document.createElement('div')
        body.id = 'at-body';

        var stats = document.createElement('div')
        stats.id = 'at-stats';

        var timeline = document.createElement('div')
        timeline.id = 'at-timeline';

        body.appendChild(stats)
        body.appendChild(timeline)

        widget.appendChild(header)
        widget.appendChild(body)

        document.body.appendChild(widget)

        this.updateStats()
        this.renderTimeline()
    }

    updateStats() {
        var stats = document.getElementById('at-stats');
        var pageviews = 0
        var clicks = 0
        var forms = 0

        for (var i = 0; i < this.data.events.length; i++) {
            if (this.data.events[i].type === 'pageview') pageviews++;
            if (this.data.events[i].type === 'click') clicks++;
            if (this.data.events[i].type === 'formsubmit') forms++;
        }

        stats.textContent = '';

        var p1 = document.createElement('p')
        p1.textContent = 'Pages Viewed: ' + pageviews;

        var p2 = document.createElement('p')
        p2.textContent = 'Clicks: ' + clicks;

        var p3 = document.createElement('p')
        p3.textContent = 'Forms Submitted: ' + forms;

        stats.appendChild(p1)
        stats.appendChild(p2)
        stats.appendChild(p3)
    }

    renderTimeline() {
        var timeline = document.getElementById('at-timeline');
        timeline.textContent = '';

        for (var i = 0; i < this.data.events.length; i++) {
            var currentEvent = this.data.events[i]
            var timelineEntry = document.createElement('div')
            timelineEntry.className = 'at-event-item'
            timelineEntry.textContent = currentEvent.type + ' - ' + new Date(currentEvent.time).toLocaleTimeString();
            timeline.appendChild(timelineEntry);
        }
    }

    toggleWidget() {
        var body = document.getElementById('at-body')
        var toggleBtn = document.getElementById('at-toggle')

        if (body.style.display === 'none') {
            body.style.display = 'block';
            toggleBtn.textContent = 'Hide';
        } else {
            body.style.display = 'none';
            toggleBtn.textContent = 'Show';
        }
    }

    attachListeners() {
        var tracker = this;

        document.addEventListener('click', function(e) {
            if (e.target.id === 'at-toggle') {
                tracker.toggleWidget();
                return;
            }
            if (e.target.id === 'at-clear') {
                tracker.clearData();
                return;
            }
            var clickEvent = {
                type: 'click',
                details: e.target.tagName,
                time: Date.now()
            };
            tracker.data.events.push(clickEvent);
            tracker.saveData();
            tracker.updateStats();
            tracker.renderTimeline();
        }, true);

        document.addEventListener('submit', function(e) {
            tracker.trackFormSubmit(e.target);
        }, true);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}