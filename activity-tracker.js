class ActivityTracker {
    // IMPLEMENT YOUR CODE HERE
    constructor() {
        // Create storage keys
        this.storageKey = "activity-tracker-data";
        this.panelStateKey = "activity-tracker-panel-open";

        // Load from localStorage or create new session
        this.data = this._load();

        // Record the initial preview without triggering render
        this._recordInitialPageview();

        // Build and render the widget
        this._buildWidget();
        this._render();

        // Attach event listeners
        this._attachListeners();
    }

    // Function for generating session ID using current time //
    _generateSessionId() {
        const ts = Date.now();
        return `session_${ts}`;
    }

    // Function for loading from localStorage or create new session if none can be loaded //
    _load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
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
        return {
            sessionId: this._generateSessionId(),
            startedAt: Date.now(),
            events: []
        };
    }

    // Function for saving to localStorage //
    _save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.warn("Failed to save session data:", e);
        }
    }

    // Function for getting the current page's name //
    _getPageName() {
        const path = location.pathname;
        const parts = path.split("/");
        return parts[parts.length - 1] || "index.html";
    }

    // Function for getting the session statistics //
    _getStats() {
        const evts = this.data.events;
        const pages = evts.filter(e => e.type === "pageview").length;
        const clicks = evts.filter(e => e.type === "click").length;
        const forms = evts.filter(e => e.type === "formsubmit").length;
        const duration = Math.round((Date.now() - this.data.startedAt) / 1000);
        return { pages, clicks, forms, duration };
    }

    // Function for recording the initial event without triggering render
    _recordInitialPageview() {
        const evt = { type: "pageview", time: Date.now(), page: this._getPageName() };
        this.data.events.push(evt);
        this._save();
    }

    // Function for creating the html element with given tag, classname, and text content //
    _el(tag, className, textContent) {
        const el = document.createElement(tag);
        if (className) {
            el.className = className;
        }
        if (textContent != null) {
            el.textContent = textContent;
        }
        return el;
    }

    // Function for describing a recorded event //
    _describeEvent(evt) {
        switch (evt.type) {
            case "pageview":
                return evt.page || "";
            case "click":
                return evt.details || "";
            case "formsubmit":
                return evt.details || "form submitted";
            default:
                return "";
        }
    }

    // Function for rendering the widget //
    _render() {
        const s = this._getStats();

        // Rebuild stats
        this.statsEl.textContent = "";
        const statEntries = [
            `Pages: ${s.pages}`,
            `Clicks: ${s.clicks}`,
            `Forms: ${s.forms}`,
            `Duration: ${s.duration}s`
        ];
        for (const text of statEntries) {
            this.statsEl.appendChild(this._el("span", "at-stat", text));
        }

        this.sessionIdEl.textContent = `Session: ${this.data.sessionId}`;

        // Rebuild timeline
        const frag = document.createDocumentFragment();
        const events = [...this.data.events].reverse();
        for (const evt of events) {
            const li = this._el("li", `at-event at-event--${evt.type}`);
            li.appendChild(this._el("span", "at-event-type", evt.type));
            li.appendChild(this._el("span", "at-event-detail", this._describeEvent(evt)));
            li.appendChild(this._el("span", "at-event-time", new Date(evt.time).toLocaleTimeString()));
            frag.appendChild(li);
        }
        this.timelineEl.textContent = "";
        this.timelineEl.appendChild(frag);
    }

    // Function for recording an event then saving and triggering render //
    _recordEvent(type, details = {}) {
        const evt = { type, time: Date.now(), ...details };
        this.data.events.push(evt);
        this._save();
        this._render();
    }

    // Function for toggling the session stats panel //
    _togglePanel() {
        const hidden = this.panel.classList.toggle("at-hidden");
        this.toggleBtn.setAttribute("aria-expanded", String(!hidden));
        try {
            localStorage.setItem(this.panelStateKey, String(!hidden));
        } catch (e) {
            console.warn("Failed to save panel state:", e);
        }
    }

    // Function for clearing session stats when the clear button is clicked //
    _clearSession() {
        localStorage.removeItem(this.storageKey);
        this.data = {
            sessionId: this._generateSessionId(),
            startedAt: Date.now(),
            events: []
        };
        this._recordEvent("pageview", { page: this._getPageName() });
    }

    // Function for building the widget that displays the session info //
    // Heavily uses the html element creation function to avoid innerHTML //
    _buildWidget() {
        // Remove any existing widget
        const existing = document.querySelector(".at-widget");
        if (existing) {
            existing.remove();
        }

        const container = this._el("div", "at-widget");

        this.toggleBtn = this._el("button", "at-toggle-btn", "Activity Tracker");

        // Restore panel open/closed state from localStorage
        let panelOpen = false;
        try {
            panelOpen = localStorage.getItem(this.panelStateKey) === "true";
        } catch (e) {
            // Ignore errors reading panel state
        }

        this.toggleBtn.setAttribute("aria-expanded", String(panelOpen));
        container.appendChild(this.toggleBtn);

        this.panel = this._el("div", panelOpen ? "at-panel" : "at-panel at-hidden");

        this.statsEl = this._el("div", "at-stats");
        this.sessionIdEl = this._el("p", "at-session-id");
        this.timelineEl = document.createElement("ul");
        this.timelineEl.className = "at-timeline";
        this.clearBtn = this._el("button", "at-clear-btn", "Clear Session");

        this.panel.appendChild(this.statsEl);
        this.panel.appendChild(this.sessionIdEl);
        this.panel.appendChild(this.timelineEl);
        this.panel.appendChild(this.clearBtn);

        container.appendChild(this.panel);
        document.body.appendChild(container);

        this.toggleBtn.addEventListener("click", () => this._togglePanel());
        this.clearBtn.addEventListener("click", () => this._clearSession());
    }

    // Function for attaching event listeners, with event delegation to optimize performance //
    _attachListeners() {
        document.addEventListener("click", (e) => {
            const el = e.target;
            if (el.closest(".at-widget")) {
                return;
            }
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls = el.className ? `.${String(el.className).split(" ")[0]}` : "";
            const desc = `<${tag}${id || cls}>${(el.textContent || "").substring(0, 30).trim()}`;
            this._recordEvent("click", { details: desc });
        }, true);

        document.addEventListener("submit", (e) => {
            const form = e.target;
            const id = form.id ? `#${form.id}` : "";
            const name = form.getAttribute("name") || "";
            const desc = id || name || "anonymous form";
            this._recordEvent("formsubmit", { details: desc });
        }, true);

        this._durationInterval = setInterval(() => {
            if (!this.panel.classList.contains("at-hidden")) {
                const s = this._getStats();
                const durEl = this.statsEl.querySelector(".at-stat:last-child");
                if (durEl) {
                    durEl.textContent = `Duration: ${s.duration}s`;
                }
            }
        }, 1000);
    }
}

// Export the class
if (typeof module !== "undefined" && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}

document.addEventListener("DOMContentLoaded", () => new ActivityTracker());