# Bug Tracker

This document outlines the potential bugs that needs to be fixed or is worth noting (for example potential bugs due to files inside the demo folder, which according to the requirements we are not allowed to change). Some debugging instructions are also included.

## Bugs

Below are the list of bugs with the discovery dates, and status of whether they are fixed, in progress, or won't be fixed.

- **2026-02-23 Major Bug - Misinterpreted Requirements (Fixed 2026-02-26):** There was a severe misunderstanding of the project requirement and the assumption was that we were tasked to build a browser extension instead of implementing the JavaScript files provided. Major revision is needed.

- **2026-02-23 Minor Bug - Adblocker Incompatibility (Won't Fix 2026-03-07):** The placeholder images seems to cause issues with certain Adblockers causing them to not load. This seems to do with the demo files and is unrelated to the activity tracker, won't fix.

- **2026-02-26 Minor Bug - Function Hoisting (Fixed 2026-02-27):** Some functions are used before being declared causing hoisting, won't affect performance but bad for maintenance. Update: technically it is inside a class definition so no need to fix?

- **2026-02-27 Minor Bug - Missing Ico (Won't Fix 2026-03-07):** The favicon.ico is missing and triggers a warning in the console. Adding it requires changing the html inside the demo folder. Won't fix

- **2026-03-03 Medium Bug - Malfunctioning Add To Cart Button (Won't Fix 2026-03-07):** Add to cart buttons in certain pages (especially products.html) is not adding relevant products to the carts. The activity tracker has been checked to be completely unrelated to this (so fixing it requires changing files in the demo folder). Won't fix.

- **2026-03-07 Minor Bug - Toggle Reset Upon Page Load (Fixed 2026-03-07):** The session stats panel, once toggled open, will return to be closed upon page reload or page redirection. Prefer to keep it open.

- **2026-03-07 Medium Bug - Excessive Session Log Info (Fixed 2026-03-07):** The session tracker's file structure in local storage contains unnecessary information which may cause performance issues. Update: Not the code's fault, see the debugging instruction for details.

- **2026-03-07 Major Bug - Duplicate Broken Popup In Product Page (Fixed 2026-03-08):** In `product1.html` there is a separate activity tracker that is popping up, which is not connected to the actual widget. **The fix involves overwriting the existing API in the page**.

- **2026-03-09 Medium Bug - Click Log Entries When Page Fails (Won't Fix 2026-03-09):** Right now when the test server stops unexpectedly which leaves a "zombie page" open and the page redirection does not work, the click event is still registered (or rather that the overall JavaScript will continue to run, until of course a page redirection is triggered and an error page shows up) but the pageview event is not. It is decided that this won't be fixed, as the log, although confusing, is actually meaningful for diagnostics.

- **2026-03-10 Major Bug - Multiple Tab Save Race Conditions (Fixed 2026-03-10):** Two tabs can overwrite each other's data due to the singleton architecture.

- **2026-03-10 Major Bug - Back to Back Synchronous And Debounced Saves (Fixed 2026-03-10):** _recordInitialPageview does a synchronous save, then _buildWidget and _attachListeners run, and any click during widget building could call _recordEvent which then calls _debouncedSave. Since _debouncedSave only saves after the set timer, the in-memory this.data has the new event but localStorage doesn't yet. If the page unloads in that window and beforeunload doesn't fire, that event is lost.

- **2026-03-10 Major Bug - Debounced Save Can Be Lost On Rapid Unload (Fixed 2026-03-10):** While the beforeunload listener should act as a safety barrier and force a save before unloading, if the browser doesn't support it, or if the save function fails when the debounced save is running, then the data can be lost.

- **2026-03-10 Major Bug - Pending Debounced Save Could Override Reset Widget Cross Tabs (Fixed 2026-03-10):** If one tab has a pending debounced save, while the other tab recently had a reset, the debounced save will still trigger causing old data to leak into the new clean timeline.

## Debugging Instruction

- **Checking Local Storage Structure:** Use the browser's developer tool. If there is a console run `JSON.parse(localStorage.getItem("activity-tracker-data"))`. If console method does not work, go to Application tab (Chrome) or Storage tab (Firefox) in the developer tools panel. Note: The `__proto__` folders sometimes seen during this debugging isn't a bug due to the code, it is just how the browser developer tools display the javascript objects.

- **Running The Script:** In VS Code, right click the `index.html` in the demo folder and use the Live Preview or Live Server function to start a server, copy and paste the URL into the desired web browser. This prevents the CORS issues.

    - **Note:** Most of the functionalities can be tested inside the VS Code preview window, however the VS Code built-in browser seems to be more restrictive and can cause issues, so copy-pasting the URL into a proper browser is recommended. Specifically the popup window seems to be missing from the VS Code built-in browser.

- **Debug Logging:** In the top of the activity tracker definition inside `activity-tracker.js`, change the line `this.DEBUG = false` inside the constructor to be `this.DEBUG = true` to turn on **all** available debug logs. If granular debugging is preferred, locate the specific methods and set their `logging` parameter to true manually. Technically since `this.DEBUG` is public there can be a UI control for it, but given the potential performance impact, it is only planned for future.