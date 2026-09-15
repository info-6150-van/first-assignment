# Activity Tracker Widget - Modified to exemplify Git

## Overview

Build an **Activity Tracker Widget** using **only HTML, CSS and Vanilla JavaScript**. The widget must track user activity (page views, button clicks, form submissions) and display them in a **timeline** widget that can expand/collapse.

-----

## Getting Started and Project Setup 

This assignment requires the use of Git for version control. You must set up your local development environment by **forking** the provided template repository. Adhering to this process and the required file structure is mandatory.

### 1\. Version Control Setup 

You must use Git and GitHub to manage your project. **Do not clone an empty repository.**

1.  **Fork the Template:** Navigate to the provided GitHub template repository URL and click the **"Fork"** button. This creates a complete copy of the template in your own GitHub account. 
2.  **Clone Your Fork Locally:** Use the `git clone` command to download your personal fork to your local machine. This creates your root project directory:
    ```bash
    # Replace <your-fork-url> with the URL of the repository you just forked
    git clone <your-fork-url>
    cd activity-tracker
    ```
3.  **Establish Upstream (Optional but Recommended):** To pull updates from the original template repository (if the instructor ever pushes fixes), add an "upstream" remote:
    ```bash
    git remote add upstream <original-template-repo-url>
    ```
4.  **Initial Status Check:** The template should already contain the required file structure (`activity-tracker.js`, `activity-tracker.css`, and the `/demo` folder). Verify the files are present before proceeding.

### 2\. Project Directory Structure (Required)

Your cloned repository **must** contain the following files and directories exactly as named:

```
/activity-tracker (Your Git root)
|
├── activity-tracker.js     <-- Your core JavaScript logic
├── activity-tracker.css    <-- Your CSS stylesheet
|
└── /demo
    ├── index.html          <-- Primary testing page (Homepage)
    └── products.html       <-- Secondary testing page (Navigation test)
```

### 3\. Local Web Server Installation (Required for Testing)

To properly test the **cross-page persistence** via `localStorage`, you **cannot** open the files directly using the `file://` protocol. You must run a local web server.

  * **VS Code Users:** Install the **Live Server** extension. Right-click on `demo/index.html` and select "Open with Live Server."

### 4\. Code Implementation Start

1.  **HTML Verification:** Ensure that all `demo/` pages have the required widget container, the target button, and correct links to your assets.
2.  **JavaScript Initialization:** Begin implementing your logic inside the provided `ActivityTracker` class in `activity-tracker.js`, ensuring it is instantiated on `DOMContentLoaded`.
3.  **Commit Your Work:** Commit frequently\! Every time you implement a new feature (e.g., persistence, click tracking), commit and push your changes.
    ```bash
    git add .
    git commit -m "FEAT: Implemented localStorage persistence logic"
    git push origin main
    ```

---

## Implementation Requirements

Students **must** implement the following:

### Mandatory Requirement: ActivityTracker Class

* **Class Implementation:** The primary logic **must** be encapsulated within an **`ActivityTracker` class** defined in `activity-tracker.js`.
* **Instantiation:** The `ActivityTracker` class **must** be instantiated on `DOMContentLoaded`.
* **Event Delegation:** Use event delegation (a single listener high in the DOM tree) for tracking user interactions rather than attaching multiple individual listeners.
* **Code Quality:** Follow best practices discussed in class and modern JavaScript standards (e.g., proper error handling, clear variable naming, organized methods).

### Core Functionality Requirements

Your implementation should provide the following capabilities:

1. **Activity Tracking** — Track and record the following user activities:
   - Page view events on page load
   - Click events (you may define the clickable elements)
   - Form submission events

2. **Session Management** — Generate a unique session identifier on first load that persists across pages.

3. **Data Persistence** — Store and retrieve session data from `localStorage` to maintain state across page navigation.

4. **Statistics** — Maintain counts for tracked activities (e.g., pages viewed, clicks, forms submitted, session duration).

5. **Timeline Display** — Display tracked events in a visual timeline format that can be toggled (shown/hidden).

---

## Required file structure

- `activity-tracker.js` — main script (should define `ActivityTracker` class and instantiate it on DOM ready).
- `activity-tracker.css` — all styles must be defined within this file, inline styles will not be considered.


> ⚠️ **ATTENTION:** Students are **not allowed to modify** the files inside the `/demo` folder, with the **only exception** being to include the links/references to `activity-tracker.js` and `activity-tracker.css`. Any other modifications to the demo files are considered violations of the assignment requirements.

---


## Suggested Implementation Details

While the specific HTML structure and CSS class names are **not** mandatory, here are suggestions for organizing your implementation:


## Persistence

- Use `localStorage` to persist session data between page navigations (e.g., from `index.html` to `products.html`).
- Choose a reasonable key name (e.g., `activity-tracker-data`).
- On page load, check if existing session data is in `localStorage`:
  - If present, restore the timeline and stats from the stored data.
  - If not, initialize a new session.
- Update `localStorage` immediately after recording new events.

**Recommended data structure (JSON):**

```js
{
    "sessionId": "session_1727895123456_ab12cd",
    "startedAt": 1727895123456,
    "events": [
        { "type": "pageview", "page": "index.html", "time": 1727895123456 },
        { "type": "click", "details": "...", "time": 1727895130000 }
    ]
}
```

---

## Implementation Recommendations

**Class Structure:**
```js
class ActivityTracker {
  constructor() {
    // Initialize: load from localStorage or create new session
    // Render the widget
    // Attach event listeners
  }
  
  // Methods to handle:
  // - Recording page views
  // - Tracking user interactions
  // - Updating statistics
  // - Persisting to localStorage
  // - Rendering/updating the UI
}

document.addEventListener("DOMContentLoaded", () => new ActivityTracker());
```

**Event Delegation Example:**
```js
document.addEventListener("click", (e) => {
  // Check if the clicked element matches your tracked elements
  // Record the event
  // Update localStorage
}, true);
```

**Key Practices:**
- Update both the DOM and `localStorage` immediately after each event.
- Use a toggle mechanism to show/hide the timeline widget.
- Include descriptive information in timeline entries (timestamps, event type, details).
- Validate that the `ActivityTracker` class is properly instantiated on page load.

---

## Grading
| Grade | Completeness: Is the project fulfilling all the technical specifications?                                                                                                                                                                                      | Correctness: Are the test passing and the logic correct?                                                                                                                                                                                                                 | Maintainability: Is the code documented, organized, and follow best practices discussed in class?                                                                                                                                                                                                              | Performance: Is the code efficient?                                                                                                                                                                                                                                                |
|-------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A     | 100% of the required HTML structure, class names, content, and CSS properties are implemented exactly as specified. All required features (page view, button click, form submit tracking, persistence) are present and fully functional.                       | All logic is flawless and all implicit Playwright tests would pass. Timestamps, Session ID format, statistic updates, and localStorage persistence are perfectly implemented. No logical errors or race conditions are present in event handling.                        | Exemplary code structure (e.g., proper class encapsulation, clear separation of concerns). Code is well-documented with clear function/method docstrings and inline comments where necessary. Follows all established best practices (e.g., event delegation, DOM manipulation optimization).                  | Highly optimized. DOM manipulation is batched or minimized (e.g., appending a single new node instead of re-rendering large sections). Event handlers are efficient. The tracking mechanism introduces negligible performance overhead (< 50ms) to page load and user interaction. |
| B     | Nearly complete. One or two minor deviations from the specification (e.g., a non-critical CSS property is missing, one optional timestamp format is slightly off). All core required features are present and functional.                                      | Mostly correct. All major features work, but there may be one minor, non-critical logical issue (e.g., a small edge case in duration calculation, one statistic update lagging slightly). All specified regex patterns for content still pass.                           | Good, professional-level code. The class structure is sound, and the code is generally easy to follow. Adequate documentation is provided, though some minor sections may lack detailed explanation or the documentation style is inconsistent.                                                                | Generally efficient. DOM updates are performed reasonably, and the script does not cause noticeable lag. The event detection and handling is efficient, but could be slightly better optimized in one area (e.g., an unnecessary DOM traversal).                                   |
| C     | Mostly complete, but with several noticeable deviations. Lacks one key requirement (e.g., Form Submission tracking is missing or improperly implemented) OR multiple minor structural/content errors (e.g., incorrect order of stats, one missing class name). | Correct, but with critical flaws. Major logical error in one core area (e.g., Persistence is partially broken across pages, Session Duration is calculated incorrectly). Some Playwright tests for a specific feature would fail.                                        | Functional, but disorganized. The implementation works, but the class structure may be weak, or the code is monolithic. Minimal or inconsistent documentation; understanding the flow requires significant effort. Best practices are sometimes ignored (e.g., direct DOM manipulation inside event handlers). | Acceptable performance. No major slowdowns, but DOM updates are inefficient (e.g., repeated, direct innerHTML updates). The code could be refactored to significantly improve execution speed in one or two key areas.                                                             |
| D     | Incomplete. Missing two or more core required features (e.g., no persistence, only tracks Page Views). Significant structural errors (e.g., the entire header is missing elements, incorrect widget hierarchy) that violate the exact specification.           | Substantially flawed logic. Multiple core statistics (e.g., Clicks, Pages) are counted incorrectly. The widget frequently breaks or fails to record events. Critical failures in data storage (e.g., using sessionStorage instead of localStorage or no storage at all). | Poorly organized and difficult to maintain. Lack of a cohesive structure (e.g., many global variables, DOM queries repeated). Documentation is absent or misleading. No adherence to best practices, making debugging challenging.                                                                             | Slow. The widget's execution causes a noticeable delay in user interaction or page load. Inefficient event handling or excessive, synchronous DOM operations severely impact the user experience.                                                                                  |
| E     | Severely incomplete. The rendered widget is barely recognizable as the one specified. More than half of the required elements, classes, or content are missing or incorrect.                                                                                   | Non-functional. The script throws frequent errors, and the main features (toggling, tracking) do not work as intended. The persisted data is unreadable or corrupts the timeline upon reload.                                                                            | Unstructured "Spaghetti Code." The code is a single, large block of logic with no proper class or function separation. Impossible to follow without significant refactoring.                                                                                                                                   | Unacceptable performance. The page freezes or is unresponsive when the script loads or an event is triggered.                                                                                                                                                                      |
| F     | Submission is not present or non-attempt. No files submitted, or the submitted code does not even attempt to implement the specified Activity Tracker widget.                                                                                                  | No functional logic present.                                                                                                                                                                                                                                             | Code is not present or is an irrelevant submission.                                                                                                                                                                                                                                                            | Code is not present or is an irrelevant submission.                                                                                                                                                                                                                                
