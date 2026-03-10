class ActivityTracker {
  constructor(options = {}) {
    this.storageKey = options.storageKey || "activity-tracker-data";
    this.maxEvents = options.maxEvents || 200;

    // State
    this.data = this._load() || this._createNewSession();
    this.ui = null;
    this.isOpen = this.data.ui?.open ?? false;
    this.pageStartTime = Date.now();

    // Ensure session exists
    if (!this.data.sessionId || !this.data.startedAt || !Array.isArray(this.data.events)) {
      this.data = this._load() || this._createNewSession();
      
    }
    const currentPage = this._getPageName();
    if (currentPage === "index.html") {
    this.data.startedAt = Date.now();
    }
    // Record pageview on load
    this.recordPageView();

    // Render + listeners
    this._injectBaseStylesHint(); 
    this._render();
    this._attachDelegatedListeners();

    // Persist initial state
    this._save();
  }

  /* -------------------------
   * Public-ish API
   * ------------------------- */

  recordPageView() {
    const page = this._getPageName();
    this._recordEvent({
      type: "pageview",
      page,
      details: page,
    });
    this._updateStats();
    this._syncUI();
  }

  resetSession() {
    this.data = this._createNewSession();
    this.isOpen = false;
    this._save();
    this._syncUI(true);
  }

  getSummary() {
    const now = Date.now();
    return {
      sessionId: this.data.sessionId,
      startedAt: this.data.startedAt,
      durationMs: Math.max(0, now - this.data.startedAt),
      stats: { ...this.data.stats },
      eventsCount: this.data.events.length,
      lastEventAt: this.data.events.at(-1)?.time ?? this.data.startedAt,
    };
  }

  /* -------------------------
   * Persistence
   * ------------------------- */

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  _save() {
    try {
      // store UI state too (open/closed)
      this.data.ui = { open: !!this.isOpen };
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch {
      // ignore storage failures (quota/private mode)
    }
  }

  _createNewSession() {
    const now = Date.now();
    const sessionId = `session_${now}_${Math.random().toString(16).slice(2, 8)}`;
    return {
      sessionId,
      startedAt: now,
      events: [],
      stats: {
        pageviews: 0,
        clicks: 0,
        forms: 0,
      },
      ui: { open: false },
    };
  }

  /* -------------------------
   * Event recording + stats
   * ------------------------- */

  _recordEvent({ type, page, details }) {
    const evt = {
      type,
      page: page || this._getPageName(),
      details: details || "",
      time: Date.now(),
    };

    this.data.events.push(evt);

    // Keep a reasonable cap (so localStorage doesn't explode)
    if (this.data.events.length > this.maxEvents) {
      this.data.events = this.data.events.slice(-this.maxEvents);
    }

    this._save();
  }

  _updateStats() {
    // You can do incremental stats too, but recalculating is safer.
    const stats = { pageviews: 0, clicks: 0, forms: 0 };
    for (const e of this.data.events) {
      if (e.type === "pageview") stats.pageviews += 1;
      else if (e.type === "click") stats.clicks += 1;
      else if (e.type === "form") stats.forms += 1;
    }
    this.data.stats = stats;
    this._save();
  }

  /* -------------------------
   * Delegated listeners
   * ------------------------- */

  _attachDelegatedListeners() {
    // Capture phase helps catch events even if something stops propagation
    document.addEventListener(
      "click",
      (e) => {
        // Don't track clicks inside the widget itself
        if (e.target.closest(".atw")) return;

        const target = e.target.closest("button, a, input, select, textarea, [role='button'], [data-track]");
        if (!target) return;

        // Optional: only track meaningful clicks
        const label = this._describeElement(target);
        this._recordEvent({
          type: "click",
          details: label,
        });

        this._updateStats();
        this._syncUI();
      },
      true
    );

    document.addEventListener(
      "submit",
      (e) => {
        if (e.target.closest(".atw")) return;

        const form = e.target;
        const name = form.getAttribute("name") || form.getAttribute("id") || "form";
        const details = `${name} submitted`;
        this._recordEvent({
          type: "form",
          details,
        });

        this._updateStats();
        this._syncUI();
      },
      true
    );
  }

  /* -------------------------
   * UI rendering
   * ------------------------- */

  _render() {
    // Create root if missing
    let root = document.querySelector(".atw");
    if (!root) {
      root = document.createElement("div");
      root.className = "atw";
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div class="atw__panel ${this.isOpen ? "is-open" : "is-closed"}" aria-live="polite">
        <div class="atw__header">
          <div class="atw__title">
            <span class="atw__dot" aria-hidden="true"></span>
            Activity Tracker
          </div>
          <div class="atw__actions">
            <button type="button" class="atw__btn atw__toggle" aria-expanded="${this.isOpen ? "true" : "false"}">
              ${this.isOpen ? "Hide" : "Show"}
            </button>
            <button type="button" class="atw__btn atw__reset" title="Reset session">
              Reset
            </button>
          </div>
        </div>

        <div class="atw__stats">
          <div class="atw__stat"><span class="atw__statLabel">Pages</span><span class="atw__statValue" data-atw-stat="pageviews">0</span></div>
          <div class="atw__stat"><span class="atw__statLabel">Clicks</span><span class="atw__statValue" data-atw-stat="clicks">0</span></div>
          <div class="atw__stat"><span class="atw__statLabel">Forms</span><span class="atw__statValue" data-atw-stat="forms">0</span></div>
          <div class="atw__stat"><span class="atw__statLabel">Duration</span><span class="atw__statValue" data-atw-stat="duration">0s</span></div>
        </div>

        <div class="atw__timelineWrap ${this.isOpen ? "" : "atw__hidden"}">
          <div class="atw__timeline" role="list" aria-label="Activity timeline"></div>
        </div>
      </div>
    `;

    this.ui = {
      root,
      panel: root.querySelector(".atw__panel"),
      toggleBtn: root.querySelector(".atw__toggle"),
      resetBtn: root.querySelector(".atw__reset"),
      timelineWrap: root.querySelector(".atw__timelineWrap"),
      timeline: root.querySelector(".atw__timeline"),
      statsEls: {
        pageviews: root.querySelector('[data-atw-stat="pageviews"]'),
        clicks: root.querySelector('[data-atw-stat="clicks"]'),
        forms: root.querySelector('[data-atw-stat="forms"]'),
        duration: root.querySelector('[data-atw-stat="duration"]'),
      },
    };

    // Widget internal controls (not part of event delegation requirement; this is inside widget)
    this.ui.toggleBtn.addEventListener("click", () => {
      this.isOpen = !this.isOpen;
      this._save();
      this._syncUI(true);
    });

    this.ui.resetBtn.addEventListener("click", () => {
      this.resetSession();
    });

    // Initial UI sync
    this._syncUI(true);

    // Update duration every second
    this._startDurationTicker();
  }

  _syncUI(forceRerenderTimeline = false) {
    if (!this.ui) return;

    // Stats
    const { pageviews, clicks, forms } = this.data.stats || { pageviews: 0, clicks: 0, forms: 0 };
    this.ui.statsEls.pageviews.textContent = String(pageviews);
    this.ui.statsEls.clicks.textContent = String(clicks);
    this.ui.statsEls.forms.textContent = String(forms);
    this.ui.statsEls.duration.textContent = this._formatDuration(Date.now() - this.pageStartTime);

    // Toggle open/close
    this.ui.toggleBtn.textContent = this.isOpen ? "Hide" : "Show";
    this.ui.toggleBtn.setAttribute("aria-expanded", this.isOpen ? "true" : "false");

    if (this.isOpen) {
      this.ui.timelineWrap.classList.remove("atw__hidden");
      this.ui.panel.classList.add("is-open");
      this.ui.panel.classList.remove("is-closed");
    } else {
      this.ui.timelineWrap.classList.add("atw__hidden");
      this.ui.panel.classList.add("is-closed");
      this.ui.panel.classList.remove("is-open");
    }

    // Timeline
    if (this.isOpen && (forceRerenderTimeline || true)) {
      this._renderTimeline();
    }
  }

  _renderTimeline() {
    if (!this.ui?.timeline) return;

    const events = this.data.events || [];
    const last = events.slice(-50).reverse(); // show latest 50

    this.ui.timeline.innerHTML = last
      .map((e) => {
        const time = this._formatTime(e.time);
        const type = this._escapeHtml(e.type);
        const page = this._escapeHtml(e.page || "");
        const details = this._escapeHtml(e.details || "");
        return `
          <div class="atw__event" role="listitem">
            <div class="atw__eventTime">${time}</div>
            <div class="atw__eventBody">
              <div class="atw__eventType">${type}</div>
              <div class="atw__eventMeta">${page}${details ? " — " + details : ""}</div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  _startDurationTicker() {
    if (this._durationTimer) return;
    this._durationTimer = setInterval(() => {
      if (!this.ui) return;
      this.ui.statsEls.duration.textContent = this._formatDuration(Date.now() - this.pageStartTime);
    }, 1000);
  }

  /* -------------------------
   * Helpers
   * ------------------------- */

  _getPageName() {
    // "index.html" / "products.html" etc.
    const path = window.location.pathname || "";
    const file = path.split("/").filter(Boolean).pop();
    return file || "index.html";
  }

  _describeElement(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";

    let text = "";
    if (tag === "input" || tag === "textarea" || tag === "select") {
      text = el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.type || "";
    } else {
      text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    }

    const href = el.tagName.toLowerCase() === "a" ? el.getAttribute("href") : "";
    const track = el.getAttribute("data-track");

    const parts = [
      `${tag}${id}${cls}`,
      track ? `track:${track}` : "",
      href ? `href:${href}` : "",
      text ? `label:${text}` : "",
    ].filter(Boolean);

    return parts.join(" | ");
  }

  _formatTime(ms) {
    try {
      return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return String(ms);
    }
  }

  _formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  _escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  _injectBaseStylesHint() {

    if (document.getElementById("atw-fallback-style")) return;
    const style = document.createElement("style");
    style.id = "atw-fallback-style";
    style.textContent = `
      .atw{position:fixed;right:16px;bottom:16px;z-index:9999;font-family:system-ui,Arial,sans-serif}
      .atw__panel{width:320px;max-width:calc(100vw - 32px);background:#111;color:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.25)}
      .atw__header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.12)}
      .atw__title{display:flex;gap:8px;align-items:center;font-weight:600}
      .atw__dot{width:10px;height:10px;border-radius:999px;background:#4ade80}
      .atw__btn{background:rgba(255,255,255,.12);border:0;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}
      .atw__actions{display:flex;gap:8px}
      .atw__stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:10px 12px}
      .atw__stat{background:rgba(255,255,255,.08);border-radius:10px;padding:8px}
      .atw__statLabel{display:block;font-size:11px;opacity:.8}
      .atw__statValue{display:block;font-size:14px;font-weight:700}
      .atw__timelineWrap{max-height:260px;overflow:auto;border-top:1px solid rgba(255,255,255,.12)}
      .atw__hidden{display:none}
      .atw__event{display:flex;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)}
      .atw__eventTime{font-size:11px;opacity:.8;min-width:72px}
      .atw__eventType{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
      .atw__eventMeta{font-size:12px;opacity:.9;word-break:break-word}
    `;
    document.head.appendChild(style);
  }
}


document.addEventListener("DOMContentLoaded", () => new ActivityTracker());

// Export the class
if (typeof module !== "undefined" && module.exports) {
  module.exports = ActivityTracker;
} else {
  window.ActivityTracker = ActivityTracker;
}