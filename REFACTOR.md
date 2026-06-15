# BoomiXcel v1.8.0.0 — What's New

Ilcome to BoomiXcel 1.8.0.0! This release is a complete overhaul — a new name, a new look, and a ton of improvements under the hood. Here's everything that changed.

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

You may have known us as "Boomi Platform Enhancer." I're now **BoomiXcel**. Same extension, same features, just a cleaner name. You'll see it in your footer bar, the options page, and the toolbar popup.

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

I dropped the "loaded" noise and the square brackets. Clicking the version takes you to the Chrome Ib Store. Clicking "Options" opens your settings.

### Brand Logo Replacement

Want the BoomiXcel logo in your masthead instead of the standard Boomi one? There's a toggle for that now — find it in the popup or the Appearance section of your options.

### Better Favicons for Every Page

If you have Unique Page Titles & Favicons enabled, you'll now see distinct favicons for every Boomi subdomain — AtomSphere, MdmSphere, ApiSphere, and Flow. I also fixed them so they actually show up on the new Boomi interface.

### Copy Document Content

When you're viewing a document in Process Reporting, you'll see a copy button in the dialog header. One click copies the raw content to your clipboard.

### Endpoint Glow

Unconnected endpoints on your build canvas now glow, making them easy to spot. Hover over one to quickly add a Stop shape. You can control this in Build Canvas settings.

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

### Firefox Should Actually Work Now

If you're a Firefox user, the extension had some behind-the-scenes issues with how it packaged itself for Firefox's extension format. That's fixed — the Firefox build now generates correctly.

### webstore-description.txt Is Finally Generated Properly

A build issue caused the store listing text to come out garbled. Now it correctly pulls the feature list from the README and formats it cleanly. (This matters when I submit updates to the Chrome Ib Store and Firefox Add-ons.)

---

## Things I Fixed

Here's the full list of bugs I squashed:

- **Favicons not changing on the new Boomi UI.** The new interface uses different URL patterns, and my favicon code didn't recognize them. Now it does, with fallbacks for any page I haven't specifically customized.
- **Data URI format bug.** The SVG favicon data had an extra space that made it invalid. Removed.
- **Popup toggles showed everything as OFF** for first-time users. Now they correctly show factory defaults (canvas grid ON, footer ON, etc.).
- **Changing a toggle in the popup triggered the reload dialog.** The popup has its own Reload button — the modal was redundant. Now the popup quietly saves without prompting.
- **buildFilters.js had a race condition.** The filter checkboxes could sometimes load in the wrong order, causing filters to not apply. Fixed by loading all filter settings in one go.
- **Duplicate Connector key** was causing a build warning on every build. Cleaned up.
- **Copy button in Document Viewer** was using CSS that bypassed my styling rules. Moved to proper CSS classes.
- **SVG icons were duplicated** across two files. Consolidated into one shared file.
- **An undeclared variable** in the settings-changed handler was silently failing. Removed.
- **Pages without a footer** could cause a JavaScript error when the extension tried to inject the footer link. Added a safety check.
- **Two debugger statements** left in production code. Removed.
- **Two console.log calls** left in production code. Removed.
- **A dead function** with a typo in its name was sitting in the codebase unused. Removed.
- **The `#close` CSS selector** could potentially collide with other page elements. Renamed to `#bph-close-notification`.
- **15+ lines of dead/commented code** cleaned up across multiple files for better maintainability.

---

## What I Removed

Some things had to go to make room for better approaches:

- **The `shortcut.js` library** — keyboard shortcuts now use native browser events. Nothing you'll notice as a user; your Ctrl+Alt+S save still works exactly the same.
- **The Bootstrap popover on the options page** — replaced with a cleaner static alert banner. This also removed two JavaScript dependencies.
- **Markdown rendering scripts** — Boomi's platform now handles markdown natively in note shapes, so I no longer need to.
- **The `webRequest` permission** — I wasn't using it, so I dropped it. Fewer permissions means a smaller security footprint.
- **22 web_accessible_resources reduced to 3** — most of my scripts now run in the extension's sandbox rather than being exposed to web pages. This significantly tightens security without affecting any features.

---

## For Developers

If you're contributing to BoomiXcel, here's what changed under the hood:

### Build System

I now have a real build pipeline. Running `npm run build` does everything: bundles content scripts, generates browser-specific manifests, creates zip packages for Chrome/Firefox/Edge, and generates the webstore description. There's also:

- `npm run watch` — rebuilds automatically when you edit content scripts
- `npm run release` — creates a GitHub release with auto-generated notes and attaches all three browser zips

### Architecture

Content scripts are now bundled by esbuild into a single file instead of loading 21+ individual scripts. All scripts share the same scope, so they can call each other's functions without polluting `window`. The only script that runs in the page context is `fullscreen.js` (because Chrome restricts the Fullscreen API).

### New Documentation

I added a bunch of docs to help contributors:

- **AGENTS.md** — developer reference covering architecture, conventions, script responsibilities, build process, and rules for keeping docs in sync
- **USER_GUIDE.md** — end-user guide explaining every feature
- **PRIVACY.md** — privacy policy and data handling
- **SECURITY.md** — how to report vulnerabilities
- **REFACTOR.md** — this file, a complete changelog from the old version
- **Pull request template** — checklist for submitting changes
- **Issue templates** — standardized bug report and feature request forms

### CI/CD

Every push and pull request now runs a GitHub Actions workflow that builds the extension on Node.js 18, 20, and 22, verifies all three browser zips are produced, and validates the Firefox manifest structure.

### Dependencies

- jQuery upgraded from 3.6 to 4.0
- esbuild bumped to 0.28.1 (fixes a security vulnerability in the Deno module)
- Added esbuild and archiver as dev dependencies

### Code Quality

I established clear conventions:
- `var` for declarations shared across files in the bundle
- `const`/`let` for file-local declarations
- All static CSS goes in `boomi.css` classes (computed/dynamic styles get an exception)
- No implicit globals
- Build scripts must produce identical output on Windows, macOS, and Linux

---

## Behind the Scenes

A few things changed that you'll never see but make the extension better:

- **esbuild now bundles everything.** Instead of 21 separate network requests for content scripts, your browser loads one optimized file. This means faster load times and fewer points of failure.
- **jQuery 4.0.** I're now on the latest jQuery release with better performance and modern browser support.
- **Firefox builds are properly validated.** The CI pipeline checks that the Firefox manifest is structurally correct before I ship.
- **The platform status check is more robust.** Instead of relying on the exact link text (which Boomi could change), I look for the link by its URL pattern. More future-proof.
- **Permissions are tighter.** I removed an unused permission and dramatically reduced the number of internal scripts exposed to web pages. The extension now has a smaller surface area for potential issues.
- **The build produces identical output on Windows, macOS, and Linux.** Previously, Windows line endings could cause the webstore description to come out wrong on different platforms. I now normalize line endings before processing.

---

**Thank you for using BoomiXcel!** If you find a bug or have a feature idea, [open an issue](https://github.com/mitchelljfranklin/BoomiXcel/issues) or join the [Boomi Discord](https://discord.gg/XcXRrYHVUa) to discuss.
