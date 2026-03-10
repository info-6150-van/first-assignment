class ActivityTracker {
    constructor() {
        // Set centralized debugging status //
        this.DEBUG = false;

        // Prevent duplicate initialization; return existing instance //
        if (window._activityTrackerInstance) {
            return window._activityTrackerInstance;
        }

        // Create storage keys //
        this.storageKey = "activity-tracker-data";
        this.panelStateKey = "activity-tracker-panel-open";

        // Load from localStorage or create new session //
        this.data = this._load();

        // Build event counters to optimize performance //
        this._eventCounts = { pages: 0, clicks: 0, forms: 0 };
        this._rebuildCounts();

        // Record the initial preview without triggering render //
        this._recordInitialPageview();

        // Build and render the widget //
        this._buildWidget();
        this._renderWidget();

        // Attach event listeners //
        this._attachListeners();

        // Remove any external debug controls that may conflict with the widget //
        // See the function comment for reasons //
        this._removeExternalDebugControls();

        // Store instance for singleton pattern //
        // This goes against the 'create new instance' pattern seen in product1.html //
        // But this allows multiple pages to share the same instance //
        // and prevents accidental instance duplications //
        window._activityTrackerInstance = this;
    }

    // Function for generating session ID using current time //
    _generateSessionId() {
        const timeStamp = Date.now();
        return `session_${timeStamp}`;
    }

    // Function for loading from localStorage or create new session if none can be loaded //
    _load(logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Attempting Loading From Local Storage Or Creating New Session If Loading Fails`);
        }
        try {
            const rawData = localStorage.getItem(this.storageKey);
            if (rawData) {
                const parsed = JSON.parse(rawData);
                if (parsed && parsed.sessionId && Array.isArray(parsed.events)) {
                    return parsed;
                }
                else {
                    console.warn("Attempted to load session data with invalid structure");
                }
            }
        } catch (e) {
            console.warn("Failed to load session data:", e);
        }
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished Loading From Local Storage Or Creating New Session If Loading Fails`);
        }
        return {
            sessionId: this._generateSessionId(),
            startedAt: Date.now(),
            events: []
        };
    }

    // Function for saving to localStorage //
    _save(logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Attempting Saving to Local Storage`);
        }
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            if (logging) {
                console.log(`[DEBUG][${new Date().toISOString()}] Finished Saving to Local Storage`);
            }
        } catch (e) {
            console.warn("Failed to save session data:", e);
        }
    }

    // Function for incrementing event counts based on input type //
    _incrementCount(type) {
        if (type === "pageview") {
            this._eventCounts.pages ++;
        }
        else if (type === "click") {
            this._eventCounts.clicks ++;
        }
        else if (type === "formsubmit") {
            this._eventCounts.forms ++;
        }
    }

    // Function for rebuilding event counters //
    _rebuildCounts() {
        this._eventCounts = { pages: 0, clicks: 0, forms: 0 };
        for (const e of this.data.events) {
            this._incrementCount(e.type);
        }
    }

    // Function for a debounced save with delay to optimize performance //
    // used to mitigate issues with rapid clicks causing saving lags //
    // although this is not directly observed on my machine //
    _debouncedSave(logging = this.DEBUG) {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._save(), 500);
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Scheduled Debounced Session Data Saving`);
        }
    }

    // Function for getting the current page name //
    _getPageName() {
        const path = location.pathname;
        const parts = path.split("/");
        return parts[parts.length - 1] || "index.html";
    }

    // Function for generating the session statistics //
    generateStatistics(logging = this.DEBUG) {
        const duration = Math.round((Date.now() - this.data.startedAt) / 1000);
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Generated Session Data Statistics`);
        }
        return { ...this._eventCounts, duration };
    }

    // Function for recording the initial event without triggering render
    // Part of a fix to prevent premature rendering and double logging of page view events //
    _recordInitialPageview() {
        const evt = { type: "pageview", time: Date.now(), page: this._getPageName() };
        this.data.events.push(evt);
        this._incrementCount("pageview");
        this._save();
    }

    // Function for creating the html element with given tag, classname, and text content //
    // Used to avoid the usage of innerHTML //
    _createHTMLElementWithAttr(tag, className, textContent, logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Attempting Creating HTML Element with tag:${tag}, className:${className}, textContent:${textContent}`);
        }
        const newElement = document.createElement(tag);
        if (className) {
            newElement.className = className;
        }
        if (textContent != null) {
            newElement.textContent = textContent;
        }
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished Creating HTML Element with tag:${tag}, className:${className}, textContent:${textContent}`);
        }
        return newElement;
        
    }

    // Function for describing a recorded event //
    _describeEvent(evt) {
        switch (evt.type) {
            case "pageview":
                return evt.page || "Generic PageView";
            case "click":
                return evt.details || "Generic Click";
            case "formsubmit":
                return evt.details || "Generic Form Submission";
            default:
                return "Uncategorized Event";
        }
    }

    // Function for updating the inline stats shown on the toggle button when the panel is closed //
    _updateToggleBtnStats() {
        const stats = this.generateStatistics();
        const isPanelHidden = this.panel.classList.contains("widget-hidden");
        if (isPanelHidden) {
            this.toggleBtnStats.textContent = `Pages: ${stats.pages} - Clicks: ${stats.clicks} - Forms: ${stats.forms}`;
            this.toggleBtnStats.classList.remove("widget-hidden");
        } else {
            this.toggleBtnStats.classList.add("widget-hidden");
        }
    }

    // Function for prepending a single event to the timeline and updating the statistics //
    _appendEventToTimeline(evt, logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Starting Appending Event To Timeline`);
        }

        const stats = this.generateStatistics();
        const statEntries = [
            `Pages: ${stats.pages}`,
            `Clicks: ${stats.clicks}`,
            `Forms: ${stats.forms}`,
            `Duration: ${stats.duration}s`
        ];
        const statSpans = this.statsEl.querySelectorAll(".widget-stat");
        for (let i = 0; i < statSpans.length; i++) {
            statSpans[i].textContent = statEntries[i];
        }

        this._updateToggleBtnStats();

        const liElement = this._createHTMLElementWithAttr("li", `widget-event widget-event--${evt.type}`);
        liElement.appendChild(this._createHTMLElementWithAttr("span", "widget-event-type", evt.type));
        liElement.appendChild(this._createHTMLElementWithAttr("span", "widget-event-detail", this._describeEvent(evt)));
        liElement.appendChild(this._createHTMLElementWithAttr("span", "widget-event-time", new Date(evt.time).toLocaleTimeString()));
        this.timelineEl.insertBefore(liElement, this.timelineEl.firstChild);

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finishes Appending Event To Timeline`);
        }
    }

    // Function for rendering the widget //
    _renderWidget(logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Starting (Re)Rendering of Widget`);
        }

        const stats = this.generateStatistics();

        // Stats //
        this.statsEl.textContent = "";
        const statEntries = [
            `Pages: ${stats.pages}`,
            `Clicks: ${stats.clicks}`,
            `Forms: ${stats.forms}`,
            `Duration: ${stats.duration}s`
        ];
        for (const text of statEntries) {
            this.statsEl.appendChild(this._createHTMLElementWithAttr("span", "widget-stat", text));
        }

        this.sessionIdEl.textContent = `Session: ${this.data.sessionId} | Started: ${new Date(this.data.startedAt).toLocaleTimeString()}`;

        // Update inline stats on toggle button //
        this._updateToggleBtnStats();

        // Timeline //
        const frag = document.createDocumentFragment();
        const events = [...this.data.events].reverse();
        for (const evt of events) {
            const liElement = this._createHTMLElementWithAttr("li", `widget-event widget-event--${evt.type}`);
            liElement.appendChild(this._createHTMLElementWithAttr("span", "widget-event-type", evt.type));
            liElement.appendChild(this._createHTMLElementWithAttr("span", "widget-event-detail", this._describeEvent(evt)));
            liElement.appendChild(this._createHTMLElementWithAttr("span", "widget-event-time", new Date(evt.time).toLocaleTimeString()));
            frag.appendChild(liElement);
        }
        this.timelineEl.textContent = "";
        this.timelineEl.appendChild(frag);

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished (Re)Rendering of Widget`);
        }
    }

    // Function for recording an event then saving and triggering render //
    _recordEvent(type, details = {}, logging = this.DEBUG) {
        const evt = { type, time: Date.now(), ...details };
        this.data.events.push(evt);
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Recorded Event of type ${type}`);
        }
        this._incrementCount(type);
        this._debouncedSave();
        this._appendEventToTimeline(evt);
    }

    // Function for toggling the session stats panel and saving the toggle states to local storage //
    togglePanel() {
        const hidden = this.panel.classList.toggle("widget-hidden");
        this.toggleBtn.setAttribute("aria-expanded", String(!hidden));
        this.toggleBtnLabel.textContent = hidden ? "Show Session Details" : "Hide Session Details";
        this._updateToggleBtnStats();
        try {
            localStorage.setItem(this.panelStateKey, String(!hidden));
        } catch (e) {
            console.warn("Failed to save panel state:", e);
        }
    }

    // Function for showing notification (directly taken from product1.html for consistent behaviors) //
    showNotification(message) {
        const notification = document.createElement('div');
        // only modified here so that the CSS style is confined to the activity tracker only //
        // and to make that the notification does not overlap the info panel //
        notification.className = 'widget-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Function for clearing session stats when the clear button is clicked //
    clearSession(logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Attempting to Clear Session Data`);
        }
        localStorage.removeItem(this.storageKey);
        this.data = {
            sessionId: this._generateSessionId(),
            startedAt: Date.now(),
            events: []
        };
        this._eventCounts = { pages: 0, clicks: 0, forms: 0 };
        this._recordEvent("pageview", { page: this._getPageName() });
        this._save();
        this._renderWidget();
        this.showNotification('Data Cleared');
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Cleared Session Data`);
        }
    }

    // Function for exporting session data as a JSON file download //
    exportToJSON(logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Attempting to Export Session Data`);
        }
        const exportData = {
            sessionId: this.data.sessionId,
            startedAt: this.data.startedAt,
            exportedAt: Date.now(),
            stats: this.generateStatistics(),
            events: this.data.events
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const dummyLink = document.createElement("a");
        dummyLink.href = url;
        dummyLink.download = `${this.data.sessionId}.json`;
        dummyLink.className = "widget-export-download";
        document.body.appendChild(dummyLink);
        dummyLink.click();
        document.body.removeChild(dummyLink);
        URL.revokeObjectURL(url);
        this.showNotification('Data Exported');
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Exported Session Data`);
        }
    }

    // Function for exporting session data and then clear data //
    exportThenClear(logging = this.DEBUG) {
        this.exportToJSON(logging);
        const confirmed = window.confirm(
            "Please confirm whether the JSON download was successful. Click OK to clear data, or Cancel to keep data."
        );
        if (confirmed) {
            this.clearSession(logging);
        }
    }

    // Function for building the widget that displays the session info //
    // Heavily uses the _createHTMLElementWithAttr function to avoid innerHTML //
    // Also has parts relevant to persistent panel toggle state and duplicates removal //
    _buildWidget(logging = this.DEBUG) {

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Starting Building Widget`);
        }

        // Remove any existing widget //
        const existingInstance = document.querySelector(".widget-baseline");
        if (existingInstance) {
            existingInstance.remove();
        }

        const container = this._createHTMLElementWithAttr("div", "widget-baseline");

        // Restore panel open/closed state from localStorage //
        let panelOpen = false;
        try {
            panelOpen = localStorage.getItem(this.panelStateKey) === "true";
        } catch (e) {
            console.warn("Failed to read panel state:", e);
        }

        // Toggle button with a label span and a stats summary span //
        this.toggleBtn = this._createHTMLElementWithAttr("button", "widget-toggle-btn");
        this.toggleBtnLabel = this._createHTMLElementWithAttr("span", "widget-toggle-btn-label", panelOpen ? "Hide Session Details" : "Show Session Details");
        this.toggleBtnStats = this._createHTMLElementWithAttr("span", panelOpen ? "widget-toggle-btn-stats widget-hidden" : "widget-toggle-btn-stats");

        this.toggleBtn.appendChild(this.toggleBtnLabel);
        this.toggleBtn.appendChild(this.toggleBtnStats);

        this.toggleBtn.setAttribute("aria-expanded", String(panelOpen));
        container.appendChild(this.toggleBtn);

        this.panel = this._createHTMLElementWithAttr("div", panelOpen ? "widget-panel" : "widget-panel widget-hidden");

        this.statsEl = this._createHTMLElementWithAttr("div", "widget-stats-flex");
        this.sessionIdEl = this._createHTMLElementWithAttr("p", "widget-session-id");
        this.timelineEl = document.createElement("ul");
        this.timelineEl.className = "widget-timeline";
        this.clearBtn = this._createHTMLElementWithAttr("button", "widget-btn", "Clear Data");
        this.exportBtn = this._createHTMLElementWithAttr("button", "widget-btn", "Export JSON");
        this.exportThenClearBtn = this._createHTMLElementWithAttr("button", "widget-btn", "Export & Clear");

        this.panel.appendChild(this.statsEl);
        this.panel.appendChild(this.clearBtn);
        this.panel.appendChild(this.exportBtn);
        this.panel.appendChild(this.exportThenClearBtn);
        this.panel.appendChild(this.sessionIdEl);

        this.divider = this._createHTMLElementWithAttr("hr", "widget-divider");
        this.panel.appendChild(this.divider);

        this.panel.appendChild(this.timelineEl);


        container.appendChild(this.panel);
        document.body.appendChild(container);

        this.toggleBtn.addEventListener("click", () => this.togglePanel());
        this.clearBtn.addEventListener("click", () => this.clearSession());
        this.exportBtn.addEventListener("click", () => this.exportToJSON());
        this.exportThenClearBtn.addEventListener("click", () => this.exportThenClear());

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished Building Widget`);
        }
    }

    // Function for removing external debug control panels that conflict with the built-in widget //
    // Needed for product1.html since it defines its own session stat debug panel //
    // Bit of a dirty fix but this is the cleanest method without changing the demo file or re-writing the code //
    _removeExternalDebugControls(logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Attempting Removing External Debug Panel`);
        }

        const observer = new MutationObserver(() => {
            const debugEl = document.querySelector(".debug-controls");
            if (debugEl) {
                if (logging) {
                    console.log(`[DEBUG][${new Date().toISOString()}] External Debug Panel Detected`);
                }
                debugEl.remove();
                observer.disconnect();
                if (logging) {
                    console.log(`[DEBUG][${new Date().toISOString()}] External Debug Panel Removed`);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Also remove immediately if it already exists //
        const existing = document.querySelector(".debug-controls");
        if (existing) {
            if (logging) {
                console.log(`[DEBUG][${new Date().toISOString()}] External Debug Panel Detected`);
            }
            existing.remove();
            observer.disconnect();
            if (logging) {
                console.log(`[DEBUG][${new Date().toISOString()}] External Debug Panel Removed`);
            }
        }

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished Pipeline Removing External Debug Panel`);
        }
    }

    // Function for attaching event listeners, with event delegation to optimize performance //
    _attachListeners(logging = this.DEBUG) {
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Starting Attaching Event Listeners`);
        }

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Starting Attaching Event Listeners To Clicks`);
        }
        document.addEventListener("click", (e) => {
            const el = e.target;
            if (el.closest(".widget-baseline")) {
                return;
            }
            if (el.classList.contains("widget-export-download")) {
                return;
            }
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls = el.className ? `.${String(el.className).split(" ")[0]}` : "";
            const desc = `<${tag}${id || cls}>${(el.textContent || "").substring(0, 30).trim()}`;
            this._recordEvent("click", { details: desc });
        }, true);
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished Attaching Event Listeners To Clicks`);
        }

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Starting Attaching Event Listeners To Form Submissions`);
        }
        document.addEventListener("submit", (e) => {
            const form = e.target;
            const id = form.id ? `#${form.id}` : "";
            const name = form.getAttribute("name") || "";
            const desc = id || name || "anonymous form";
            this._recordEvent("formsubmit", { details: desc });
        }, true);
        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished Attaching Event Listeners To Form Submissions`);
        }

        // Force a save upon unloading to make sure pending changes are saved //
        window.addEventListener("beforeunload", () => {
            clearTimeout(this._saveTimer);
            this._save();
        });

        this._durationInterval = setInterval(() => {
            if (!this.panel.classList.contains("widget-hidden")) {
                const stats = this.generateStatistics();
                const durEl = this.statsEl.querySelector(".widget-stat:last-child");
                if (durEl) {
                    durEl.textContent = `Duration: ${stats.duration}s`;
                }
            }
        }, 1000);

        if (logging) {
            console.log(`[DEBUG][${new Date().toISOString()}] Finished Attaching Event Listeners`);
        }
    }
}

// Export the class
if (typeof module !== "undefined" && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}

document.addEventListener("DOMContentLoaded", () => {
    if (!window._activityTrackerInstance) {
        new ActivityTracker();
    }
});