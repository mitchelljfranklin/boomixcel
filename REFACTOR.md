# BoomiXcel v1.8.0.0 — What's New

Welcome to BoomiXcel 1.8.0.0! This release is a complete overhaul — a new name, a new look, and a ton of improvements under the hood. Here's everything that changed.

---

## Table of Contents

- [A New Name](#a-new-name)
- [New Features You'll Notice](#new-features-youll-notice)
- [Things That Got Better](#things-that-got-better)
- [Things I Fixed](#things-i-fixed)
- [What I Removed](#what-i-removed)
- [For Developers](#for-developers)
- [Behind the Scenes](#behind-the-scenes)

---

## A New Name

You may have known it as "Boomi Platform Enhancer." I'm now **BoomiXcel**. Same extension, same features, just a cleaner name. You'll see it in your footer bar, the options page, and the toolbar popup.

---

## New Features You'll Notice

### One-Click Settings Popup

Click the BoomiXcel icon in your browser toolbar and a compact panel pops open right there on the Boomi page. You can instantly toggle your most-used features without ever opening the full settings page:

- Show Canvas Grid
- Replace Brand Logo
- Old-Style Play/Pause Icons
- Reverse Modal Buttons (OK/Cancel)
- Show Boomi Footer
- Unique Page Titles & Favicons
- Default Process Filters
- Post-Deployment Schedule Reminder

Each toggle saves instantly. There's a **Reload Page** button to apply changes to the current tab, and a **Full Settings** button if you need the complete options page.

### Platform Status Just Got Clearer

I still check Boomi's platform status on every page, but now there's a colored dot that tells you the state at a glance:

- Green dot = All Systems Operational
- Orange dot = Partial Service Disruption
- Red dot = Major Outage
- Blue dot = Under Maintenance

No more squinting at the footer text — the dot says it all.

### Cleaner Footer Bar

The footer now reads simply: `BoomiXcel v1.8.0.0 · Options`

I dropped the "loaded" noise and the square brackets. Clicking the version takes you to the Chrome Web Store. Clicking "Options" opens your settings.

### Brand Logo Replacement

Want the BoomiXcel logo in your masthead instead of the standard Boomi one? There's a toggle for that now — find it in the popup or the Appearance section of your options.

### Better Favicons for Every Page

If you have Unique Page Titles & Favicons enabled, you'll now see distinct favicons for every Boomi subdomain — AtomSphere, MdmSphere, ApiSphere, and Flow. I also fixed them so they actually show up on the new Boomi interface.

### Copy Document Content

When you're viewing a document in Process Reporting, you'll see a copy button in the dialog header. One click copies the raw content to your clipboard.

### Endpoint Glow

Unconnected endpoints on your build canvas now glow, making them easy to spot. Hover over one to quickly add a Stop shape. You can control this in Build Canvas settings.

### Configurable Dashboard Default Time Range

The dashboard no longer always defaults to 7 days — you can now choose your preferred time range from the Options page under Process Reporting. Options: 7 Days (default), 1 Month, 3 Months, 6 Months, 1 Year, or Max. It auto-selects your choice whenever the Dashboard page loads.

### DB Document Table Viewer

When viewing a database document (DBSTART| format) in the Document Viewer dialog, a **See table** toggle switch appears in the top-right corner. Toggle it on to render the raw pipe-delimited data as a sortable, searchable, paginated table — all vanilla JavaScript, no external libraries. Click column headers to sort (with ▲/▼ indicators), use the search box to filter, and navigate with page buttons (25 rows per page). A **maximize/restore** button sits next to the toggle, letting you expand the dialog to 90% of the viewport. The raw document content is shared with the copy and download scripts so those features continue working even when the table view is active.

### Boomi GPT Revision Compare

Checkboxes now appear in the Revision History modal next to each revision number. Click anywhere on a revision row to toggle its checkbox. Selected rows get a subtle blue highlight, and checkboxes use the Boomi blue accent color. Check two revisions and the Boomi GPT panel link updates to "Compare vX and vY →" — clicking it opens BoomiAI with a pre-filled compare prompt for the component's two selected versions. The GPT page auto-injects the prompt into the chat input via the React native value setter and auto-submits. Checking a third revision automatically unchecks the oldest selection. The popup also widens slightly (700px) to show more column content.

### View in Process Reporting from Deployed Processes

A **View in Process Reporting** feature now provides quick access from two entry points: a heartbeat SVG quick-link icon next to the Description link on the build page, and a menu item with a separator line in the chevron context menu on deployed process lists (Atom/Runtime). Clicking either opens the Process Reporting page in a new tab, which auto-applies a process name filter via a polling state machine: Add Filter → Process → type native value setter → select checkbox → Apply. A confirming toast shows "Filtered for: {name}" when the filter is applied. The deployed process menu handles GWT's context menu lifecycle — the `<ul>` is reused across clicks with `innerHTML` cleared, so a retry injector polls for the execute link before injecting on every open.

### Copy Component XML

A copy button now appears in the header of the Component XML popup on the build page. Clicking it decodes HTML-encoded XML (`<br>` → newline, `&nbsp;` → space) and writes clean XML to the clipboard. The button shares its implementation with the existing document viewer copy button via a shared `createCopyButton()` factory extracted from `copyDocument.js`.

### Unsaved Changes Indicator

The options page now shows a yellow dot when you've made changes you haven't saved yet. No more wondering "did I click Save or not?"

### Reset to Defaults

Changed too many settings? Hit the Reset button on the options page to restore everything to factory defaults.

---

## Things That Got Better

### Options Page Redesign

The settings page got a complete makeover:

- Clean white card layout instead of dark panels
- Settings grouped into collapsible sections (Appearance, Build Canvas, Process Reporting, Navigation & Shortcuts, Reminders)
- Toggle switches now match the popup's slider style
- A sticky Save bar that stays visible as you scroll
- Yellow alert banner for the Boomi disclaimer — no more popover

### Toggle Switches Everywhere

Every on/off option in both the popup and the full settings page now uses the same smooth slider toggle. They look and feel identical wherever you use them.

### Better Favicon Reliability

I rewrote how favicons update so they actually refresh in your browser tab. Previously the browser would sometimes cache the old icon and ignore the change. Now it always updates.

### Masthead Options Gear Icon

A gear icon now appears in the masthead addons row next to Search, Help, Messages, and Agentstudio. Clicking it opens the BoomiXcel options page — no more scrolling to the footer to access settings. The footer still shows the version link but the "Options" text has been removed from it.

### Firefox Should Actually Work Now

If you're a Firefox user, the extension had some behind-the-scenes issues with how it packaged itself for Firefox's extension format. That's fixed — the Firefox build now generates correctly.

### Custom Refresh Code Rewritten

The auto-refresh feature on Process Reporting got a thorough cleanup and visual overhaul:

- **Countdown timer** — the button now shows a live countdown ("Refreshing in 14s" → "13s" → ...) so you always know when the next refresh will fire. Seconds are zero-padded for a stable button width.
- **Visual pulse** — a subtle scale animation plays each time a refresh fires, providing a reassuring visual confirmation without a distracting toast.
- **Hover tooltip** — shows "Last refreshed at HH:MM:SS" when you hover over the button.
- **Persistent state** — if you navigate away from Process Reporting while auto-refresh is running, it automatically resumes when you come back. No need to re-click the button.
- **Visual button overhaul** — pill-shaped button with gradient backgrounds (orange off / green on), an embedded SVG refresh icon, smooth transitions, and a green glow on the active state.
- **Delegated click handler** — replaced stacked jQuery `.click()` handlers with a single delegated listener, preventing handler accumulation on re-renders.
- **Re-entrance guard** — won't inject duplicate buttons or orphan intervals if the DOM re-renders.

### Process Duration Split Out

The live elapsed-time counter for in-progress executions now lives in its own file (`processDuration.js`), separated from the auto-refresh logic (`customRefresh.js`). They were two unrelated features sharing one file — now they're cleanly divided with clear responsibilities. The counter also got a visual overhaul: active rows have a red left accent bar, the elapsed time cell gets a gradient red badge treatment, and the seconds digit does a subtle scale bounce on each update tick.

---

## Things I Fixed

Here's the full list of bugs I squashed:

- **Favicons not changing on the new Boomi UI.** The new interface uses different URL patterns, and my favicon code didn't recognize them. Now it does, with fallbacks for any page I haven't specifically customized.
- **Data URI format bug.** The SVG favicon data had an extra space that made it invalid. Removed.
- **Changing a toggle in the popup triggered the reload dialog.** The popup has its own Reload button — the modal was redundant. Now the popup quietly saves without prompting.
- **buildFilters.js had a race condition.** The filter checkboxes could sometimes load in the wrong order, causing filters to not apply. Fixed by loading all filter settings in one go.
- **SVG icons were duplicated** across two files. Consolidated into one shared file.
- **An undeclared variable** in the settings-changed handler was silently failing. Removed.
- **Pages without a footer** could cause a JavaScript error when the extension tried to inject the footer link. Added a safety check.
- **Two debugger statements** left in production code. Removed.
- **Two console.log calls** left in production code. Removed.
- **A dead function** with a typo in its name was sitting in the codebase unused. Removed.
- **The `#close` CSS selector** could potentially collide with other page elements. Renamed to `#bph-close-notification`.
- **15+ lines of dead/commented code** cleaned up across multiple files for better maintainability.
- **Dashboard 7-day auto-select never fired.** The guard condition waited for a third `gwt-viz-container` element that never appeared on the current Boomi dashboard. Replaced with a direct check for the time range selector elements, and moved all polling to the centralized DOM listener.
- **`return false` in setInterval callbacks.** Pointless in this context — changed to plain `return`.
- **Fragile DOM index for elapsed-time cell.** The counter code used `div[11]` to find the cell — added a null guard so it won't crash if Boomi changes their DOM structure.
- **Hashchange listener was stacking.** Each re-entry into the refresh listener added another `hashchange` handler. Moved to module level so it registers once.
- **Elapsed time counter red text not displaying.** The counter used inline `element.style.color = "red"` which Boomi's platform CSS can override with `!important` rules. Replaced with a CSS class (`bph-elapsed-active`) using `!important` at the extension stylesheet level, matching Boomi's cascade tier.
- **Download renamer corrupted ZIP/binary files.** The `detectTypeFromText()` function misidentified binary content as CSV/TXT because the ASCII-range regex matched binary magic bytes (e.g., ZIP headers). Added `isBinaryContent()` helper that checks for null bytes and high ratio of non-printable characters — binary files now return `null`, so `background.js` falls back to the original extension from the download URL.
- **Elapsed time counter visual overhaul.** Added a red left accent bar on active rows (`bph-processing-row`), a gradient red badge on the elapsed cell (`bph-elapsed-badge`), and a per-second scale bounce animation (`bph-elapsed-tick`) so the counter feels live.
- **Convention audit and cleanup.** Full audit of all content scripts against the project's code style rules. Fixed 6 implicit globals that would break under strict mode, converted 12 `const`/`let` declarations to `var` for cross-file IIFE contract compliance, and renamed 54+ abbreviated variables/parameters to descriptive names across 22 files.
- **Reverse modal buttons not working on "No" dialogs.** The `modalButtons.js` listener checked `innerText === "Cancel"` but Boomi's "unsaved changes" modal uses "No". Also skipped a hidden spinner div that was incorrectly targeted by `lastChild`. Fixed by filtering visible `<button>` children from `.button_set` and matching both "Cancel" and "No".
- **Update notification system overhauled.** Changelog content now comes from a dedicated `updateNotification.md` file (edited before each release) instead of hardcoded arrays in JavaScript. The build script reads it and injects it into the bundle as `UPDATE_CHANGELOG_HTML`. Storage uses a single key (`bph_update_notification_version`) instead of one key per version, with automatic cleanup of legacy `boomiplatenhanUpdateNot*` keys. Removed unnecessary `typeof Storage` guard and 1-second injection delay.
- **Build process filters never applied.** Three issues stacked: the `.filter_popup` selector no longer matched Boomi's current inline `.filter_options` panel; the panel exists hidden in the DOM at page load so `document.arrive` fired before checkbox labels were populated; the refactored `BoomiPlatform` read had a race condition with `listenerGlobal.js` init order. Fixed by changing to a capture-phase click listener on the filter icon with a 300ms delay and 200ms polling retry for checkbox labels.
- **Redundant `chrome.storage.sync.get()` calls.** Three scripts (`favicon.js`, `scheduleIcons.js`, `reminders.js`) were doing their own storage reads for keys already loaded by `listenerGlobal.js` into `BoomiPlatform`. Replaced with direct `BoomiPlatform` reads — eliminating duplicate I/O. `buildFilters.js` retains its direct call because it loads early in the bundle order and needs fresh config each time the filter opens.
- **`pageInit.js` had a `ReferenceError`** — `e.headerVisible` used an undefined variable `e` instead of the callback parameter `result`. The entire header show/hide toggle feature was subsequently removed as no longer needed, so the broken code was deleted rather than fixed.
- **View in Process Reporting icon misaligned.** The build-page monitor link SVG was 20px while adjacent Boomi icons (Folder, Description) are 24px. Now matches at 24px with inline style for proper grid alignment.
- **`updateNotification.md` markdown links rendered as text.** The `[See all changes](url)` pattern was injected as literal text. Added `convertMarkdownLinks()` to the build script to transform `[text](url)` into `<a href="url" target="_blank">text</a>`.

---

## What I Removed

Some things had to go to make room for better approaches:

- **The `shortcut.js` library** — keyboard shortcuts now use native browser events. Nothing you'll notice as a user; your Ctrl+Alt+S save still works exactly the same.
- **The Bootstrap popover on the options page** — replaced with a cleaner static alert banner. This also removed two JavaScript dependencies.
- **Markdown rendering scripts** — Boomi's platform now handles markdown natively in note shapes, so I no longer need to.
- **The `webRequest` permission** — I wasn't using it, so I dropped it. Fewer permissions means a smaller security footprint.
- **22 web_accessible_resources reduced to 3** — most of my scripts now run in the extension's sandbox rather than being exposed to web pages. This significantly tightens security without affecting any features.
- **The `dashboard.js` file** — its logic (calling `dashboardDays()` on page load and hash change) moved to the centralized DOM poller in `listenerGlobal.js`. The file was reduced to comments, then deleted.
- **The separate polling loop in `dashboardDays()`** — the function had its own `setInterval` watching for dashboard DOM. Now it's a direct function called by the existing centralized 1-second poller, same as every other feature.
- **The header show/hide toggle** — the Show Header / Hide Header button on the navigation bar has been removed. No longer needed.
- **The note group feature (`groups.js`)** — Boomi's platform now handles note grouping natively, so the extension's colored bounding boxes and Group button have been removed.
- **Expand notes from image capture** — the "Expand notes" checkbox in the Process Image Capture dialog has been removed. The auto-expand note logic was tied to the old note system. Only transparency and scale options remain.

---

## For Developers

If you're contributing to BoomiXcel, here's what changed under the hood:

### Build System

I now have a real build pipeline. Running `npm run build` does everything: bundles content scripts, reads `updateNotification.md` and injects its changelog as HTML into the bundle, generates browser-specific manifests, creates zip packages for Chrome/Firefox/Edge, and generates the webstore description. There's also:

- `npm run watch` — rebuilds automatically when you edit content scripts
- `npm run release` — creates a GitHub release with auto-generated notes and attaches all three browser zips

### Architecture

Content scripts are now bundled by esbuild into a single file instead of loading 38 individual scripts. All scripts share the same IIFE scope, so they can call each other's functions without polluting `window`. The only script that runs in the page context is `fullscreen.js` (because Chrome restricts the Fullscreen API). Key architectural patterns introduced:

- **Centralized polling** — `listenerGlobal.js` runs a `listenerClass()` interval that watches for DOM elements via `:not(.bph-load-done)` selector, then calls feature-specific listener functions
- **DOM detection** — `document.arrive()` (via arrive.js) watches for dynamically created elements and fires callbacks on insertion
- **Shared factory** — `createCopyButton()` in `copyDocument.js` is a reusable factory for clipboard-copy buttons with tooltip, SVG swap feedback, and clipboard fallback
- **Modal helper** — `renderBoomiModal()` with an opt-in `modern: true` parameter for rounded corners, softer shadows, and button gap styling

### New Documentation

I added a bunch of docs to help contributors:

- **AGENTS.md** — developer reference for AI Agent use to help others wanting to use AI covering architecture, conventions, script responsibilities, build process, and rules for keeping docs in sync
- **USER_GUIDE.md** — end-user guide explaining every feature
- **PRIVACY.md** — privacy policy and data handling
- **SECURITY.md** — how to report vulnerabilities
- **REFACTOR.md** — this file, a complete changelog from the old version
- **Pull request template** — checklist for submitting changes
- **Issue templates** — standardized bug report and feature request forms

### Dependencies

- jQuery upgraded from 3.6 to 4.0
- esbuild bumped to 0.28.1 (fixes a security vulnerability in the Deno module)
- Added esbuild and archiver as dev dependencies

### Code Quality

I established clear conventions and performed a full audit of all 38 content scripts:

- `var` for declarations shared across files in the bundle
- `const`/`let` for file-local declarations
- All static CSS goes in `boomi.css` classes (computed/dynamic styles get an exception)
- No inline `style=""` attributes or `element.style.*` for static values
- No implicit globals
- **Variable names must be descriptive** — no single-letter or heavily abbreviated names (`el`, `e`, `cb`, `k`, `v`). Function parameters in callbacks must use meaningful names like `function (selector)` not `function (el)`.
- **Convention audit completed** — fixed 5 implicit globals, converted 12 `const`/`let` to `var` for IIFE contract compliance, and renamed 44+ abbreviated variables across 18 files

### Update Notification Changelog

The in-app update notification now reads from a dedicated `updateNotification.md` file at the repo root (edited before each release). The build script converts its content to HTML, transforms `[text](url)` markdown links to clickable anchors, and injects it as `var UPDATE_CHANGELOG_HTML` into the bundle. Storage uses a single `bph_update_notification_version` key with automatic cleanup of legacy per-version keys.

---

## Behind the Scenes

A few things changed that you'll never see but make the extension better:

- **esbuild now bundles everything.** Instead of 21 separate network requests for content scripts, your browser loads one optimized file. This means faster load times and fewer points of failure.
- **jQuery 4.0.** I'm now on the latest jQuery release with better performance and modern browser support.
- **Firefox builds are properly validated.** The CI pipeline checks that the Firefox manifest is structurally correct before I ship.
- **The platform status check is more robust.** Instead of relying on the exact link text (which Boomi could change), I look for the link by its URL pattern. More future-proof.
- **Permissions are tighter.** I removed an unused permission and dramatically reduced the number of internal scripts exposed to web pages. The extension now has a smaller surface area for potential issues.

---

**Thank you for using BoomiXcel!** If you find a bug or have a feature idea, [open an issue](https://github.com/mitchelljfranklin/BoomiXcel/issues) or join the [Boomi Discord](https://discord.gg/XcXRrYHVUa) to discuss.
