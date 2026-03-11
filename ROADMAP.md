# Activity Tracker Widget — Implementation Roadmap

> **AI Disclosure:** This roadmap was created with the assistance of generative AI (Claude by Anthropic). The work may take inspiration from templates, examples, or code snippets that generative AI produced; however, all finalized code will be transcribed and invigilated by myself in compliance with the course policies and in the spirit of transparency.

## Overview

This document outlines a step-by-step plan for building the Activity Tracker Widget. The project tracks user activity (page views, button clicks, form submissions) and displays them in a collapsible timeline widget using only HTML, CSS, and Vanilla JavaScript.

---

## Phase 1: Setup & Foundation

1. **Fork & clone** the template repository. Verify the required file structure is in place:
   - `activity-tracker.js`
   - `activity-tracker.css`
   - `/demo/index.html`
   - `/demo/products.html`
2. **Install a local web server** (e.g., the VS Code Live Server extension) to serve files over `localhost`. Testing via the `file://` protocol will break `localStorage` persistence.
3. **Add asset references** in both `demo/index.html` and `demo/products.html`. Link to `activity-tracker.css` and `activity-tracker.js`. This is the **only** permitted modification to the demo files.
4. **Commit:** `"SETUP: Initial project setup and asset linking"`

---

## Phase 2: Core Class & Session Management

1. **Define the `ActivityTracker` class** inside `activity-tracker.js`.
2. **Instantiate it** within a `DOMContentLoaded` event listener.
3. In the **constructor**, check `localStorage` for existing session data:
   - **If found:** Parse the stored JSON and restore the session (ID, start time, events array).
   - **If not found:** Generate a unique session ID (e.g., `session_<timestamp>_<randomChars>`), record a `startedAt` timestamp, and initialize an empty events array.
4. **Create a `save()` helper method** that serializes the current session object to `localStorage`. This method will be called after every state change.
5. **Commit:** `"FEAT: Session management and localStorage persistence"`

---

## Phase 3: Event Tracking

Implement each tracking type using **event delegation** (a single listener high in the DOM tree) rather than attaching individual listeners to each element.

### 3a. Page View Tracking

- On initialization (after session data is loaded or created), push a `pageview` event to the events array with the current page name and a timestamp.
- Call `save()`.
- **Commit:** `"FEAT: Page view tracking"`

### 3b. Click Tracking

- Attach a **single** `click` listener on `document`.
- Inside the handler, inspect `e.target` to determine what was clicked. Record a `click` event with descriptive details (e.g., tag name, text content, element ID).
- Call `save()`.
- **Commit:** `"FEAT: Click event tracking via event delegation"`

### 3c. Form Submission Tracking

- Attach a **single** `submit` listener on `document`.
- Record a `formsubmit` event with relevant form details.
- Call `save()`.
- **Commit:** `"FEAT: Form submission tracking"`

---

## Phase 4: Statistics Calculation

1. **Compute stats dynamically** from the events array on each update:
   - Total page views
   - Total clicks
   - Total form submissions
   - Session duration (`Date.now() - startedAt`)
2. Create a dedicated method (e.g., `updateStats()`) that recalculates these values and updates the corresponding DOM elements.
3. Call this method whenever a new event is recorded.
4. **Commit:** `"FEAT: Live statistics calculation and display"`

---

## Phase 5: Timeline Widget UI

### 5a. Widget Creation

- **Dynamically create** the entire widget container via JavaScript and inject it into the page. This avoids modifying the demo HTML files.
- Use a fixed or absolute positioned panel so the widget is accessible on any page.

### 5b. Timeline Rendering

- Loop through the stored events array and create a DOM element for each entry.
- Each entry should display the event type, descriptive details, and a human-readable timestamp.
- Use distinct visual indicators (colors, icons, or labels) for each event type.

### 5c. Expand / Collapse Toggle

- Add a clickable header or button to the widget that toggles the visibility of the timeline list.
- Use a CSS class to control the show/hide state.

### 5d. Styling

- Write **all styles** in `activity-tracker.css`. No inline styles.
- Make the widget visually clear and readable: distinct event types, formatted timestamps, smooth toggle transitions.

5. **Commit:** `"FEAT: Timeline widget UI with expand/collapse toggle"`

---

## Phase 6: Polish & Performance

1. **Efficient DOM updates:** When a new event is recorded, **append a single new timeline entry** to the existing list rather than re-rendering the entire timeline.
2. **Error handling:** Wrap all `localStorage` access and `JSON.parse` calls in `try/catch` blocks to handle storage limits or corrupted data gracefully.
3. **Cross-page testing:** Navigate back and forth between `index.html` and `products.html`. Verify that:
   - Events persist across pages.
   - Statistics accumulate correctly.
   - The session ID remains the same.
4. **Code documentation:**
   - Add JSDoc-style comments to every method.
   - Include brief inline comments for any non-obvious logic.
5. **Final commit & push:** `"CHORE: Final polish, documentation, and performance optimization"`

---

## Key Pitfalls to Avoid

| Pitfall | Why It Matters |
|---|---|
| Using `sessionStorage` instead of `localStorage` | `sessionStorage` is cleared when the tab closes and does not persist across page navigations in some contexts. |
| Attaching individual listeners to every interactive element | Violates the event delegation requirement and hurts maintainability. |
| Modifying demo HTML files beyond adding asset references | Explicitly prohibited by the assignment. |
| Re-rendering the entire timeline on every new event | Causes unnecessary DOM thrashing and hurts performance. Append only. |
| Forgetting to call `save()` after recording an event | Data will be lost on page navigation. |
| Opening files via `file://` instead of a local server | `localStorage` behaves inconsistently or is blocked under the file protocol. |

---

## Suggested Commit History

| Order | Message |
|---|---|
| 1 | `SETUP: Initial project setup and asset linking` |
| 2 | `FEAT: Session management and localStorage persistence` |
| 3 | `FEAT: Page view tracking` |
| 4 | `FEAT: Click event tracking via event delegation` |
| 5 | `FEAT: Form submission tracking` |
| 6 | `FEAT: Live statistics calculation and display` |
| 7 | `FEAT: Timeline widget UI with expand/collapse toggle` |
| 8 | `CHORE: Final polish, documentation, and performance optimization` |

---

## Grading Alignment

This roadmap is structured to address the four grading dimensions in priority order:

1. **Completeness** (Phases 1–5): Every required feature is accounted for.
2. **Correctness** (Phase 3–4): Tracking logic, persistence, and stats are built and tested incrementally.
3. **Maintainability** (Phase 6): Documentation, class encapsulation, and clean separation of concerns.
4. **Performance** (Phase 6): Efficient DOM updates and minimal overhead.