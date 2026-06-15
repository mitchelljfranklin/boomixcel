# BoomiXcel v1.8.0.0 — Refactor & Change Log

A detailed technical comparison of the OLD project (`/root/github/OLD`, version 1.7.4.8) against the current BoomiXcel codebase (version 1.8.0.0). Every architectural change, feature addition, bug fix, documentation improvement, code cleanup, and structural difference is documented below with file paths and technical context.

---

## Table of Contents

- [Architecture Changes](#architecture-changes)
- [New Features](#new-features)
- [Features Removed](#features-removed)
- [Bug Fixes](#bug-fixes)
- [Styling & UI](#styling--ui)
- [Documentation](#documentation)
- [CI/CD & Build](#cicd--build)
- [Security](#security)
- [Code Quality](#code-quality)
- [Content Script Inventory](#content-script-inventory)
- [Summary](#summary)

---

## Architecture Changes

### Content Script Bundling

The most significant architectural change is moving from individually-loaded content scripts to an esbuild-bundled architecture.

**OLD approach:** The manifest (`src/manifest.json`) listed 21 individual JavaScript files in `content_scripts[1].js`. Additionally, `contentScript.js` (loaded first) called `loadScript()` to inject 10+ other scripts into the page context via `<script>` tags. This meant:
- 21 network requests for content scripts
- Scripts loaded via `loadScript()` ran in the page context (not the extension's isolated world), meaning they had access to page globals but NOT `chrome.*` APIs
- Every script had its own scope — cross-file communication required `window.*` globals or `postMessage`
- Adding a new script required updating TWO places: the manifest AND `contentScript.js`'s `loadScript()` calls

**Current approach:** All 36 content scripts in `src/library/boomiapp/content/` are concatenated in a specific order (defined by `CONTENT_ORDER` in `scripts/build.js`) and bundled by esbuild into a single file: `src/library/boomiapp/content/bundle.js`. The manifest loads only this one bundle at `document_end`. This means:
- One network request for all content script logic
- All scripts share the same IIFE scope — `var` and `function` declarations at the top level of any file are accessible from every other file in the bundle
- No `window.*` pollution needed for cross-file communication
- No `loadScript()` needed except for `page/fullscreen.js` (requires page context for Fullscreen API)
- Adding a new content script only requires adding it to `CONTENT_ORDER` and running `npm run build`

**Bundle order** (`CONTENT_ORDER` in `scripts/build.js`):
```
contentScript.js → global.js → svgAssets.js → modalHelper.js → toastHelper.js →
pageInit.js → favicon.js → headerActions.js → dashboard.js → shapePalette.js →
keyboardShortcuts.js → updateNotification.js → messageEditor.js → reminders.js →
buildFilters.js → filterButtons.js → shapePopup.js → menuOpen.js → copyDocument.js →
downloadRename.js → scheduleIcons.js → iconSets.js → modalButtons.js →
listenerGlobal.js → canvas.js → customRefresh.js → shapes.js → endpointGlow.js →
tableWrap.js → imageCapture.js → groups.js → connectionOperations.js →
versionNotification.js → sqlEditor.js → brandLogo.js
```

Critical ordering constraints:
- `contentScript.js` must be first (it injects `fullscreen.js` into the page context)
- `iconSets.js` must precede `listenerGlobal.js` (listenerGlobal references icon data objects)
- `svgAssets.js` must precede any file that references SVG constants (modalHelper, copyDocument)
- `listenerGlobal.js` must precede feature scripts that read `BoomiPlatform.*` config values

### Page Context vs Content Context

**OLD:** 10+ scripts were loaded into the page context via `loadScript()`:
`canvas.js`, `customRefresh.js`, `connectionOperations.js`, `versionNotification.js`, `modalButtons.js`, `tableWrap.js`, `imageCapture.js`, `groups.js`, `iconSets.js`, `listenerGlobal.js`, plus others.

**Current:** Only `src/library/boomiapp/page/fullscreen.js` runs in the page context. It is injected by `src/library/boomiapp/content/contentScript.js` using `loadScript()`, and receives its configuration via `window.postMessage` from the content script. Chrome restricts the Fullscreen API (`element.requestFullscreen()`) from the isolated world, which is why this one script must remain in page context.

All other scripts now run in the content script's isolated sandbox within the bundle's IIFE scope. They have full access to `chrome.*` APIs, `document.arrive()`, and `CodeMirror`.

### Manifest Changes

**File:** `src/manifest.json`

| Key | OLD | Current | Reason |
|-----|-----|---------|--------|
| `name` | `Boomi Platform Enhancer` | `BoomiXcel` | Rebrand |
| `version` | `1.7.4.8` | `1.8.0.0` | Version bump |
| `action` | Not present | `{ "default_popup": "popup/popup.html", "default_icon": {...} }` | Toolbar popup support |
| `content_scripts[0].js` | jQuery 3.6, CodeMirror libs | jQuery 4.0, **showdown**, **rasterizeHTML**, CodeMirror libs | Two additional libraries loaded at `document_start` |
| `content_scripts[1].js` | 21 individual files | `content/bundle.js` only | Single bundled file |
| `web_accessible_resources` | 22 entries | 3 entries (`*.png`, `*.jpg`, `page/fullscreen.js`) | Dramatically reduced — only what the page needs to load |
| `permissions` | `["storage", "downloads", "webRequest"]` | `["storage", "downloads"]` | webRequest removed (unused) |
| `host_permissions` | Not present | `["https://platform.boomi.com/*"]` | Explicit host access declaration |

### Build System

**OLD:** No build system existed. Content scripts were loaded individually. Browser manifests (`chrome.json`, `firefox.json`, `edge.json`) were maintained as 3 separate static files in a `Manifest/` directory. ZIP files were created manually and stored in `build/` (68 old zip files).

**Current:** `scripts/build.js` (~398 lines) provides:
1. **esbuild bundling** — reads all files from `CONTENT_ORDER`, concatenates them with two no-op stubs (`add_fullscreen_listener`, `add_notecontent_listener`), runs esbuild to produce a minified IIFE bundle at `src/library/boomiapp/content/bundle.js`
2. **Stub injection** — injects `const add_fullscreen_listener = () => {};` and `const add_notecontent_listener = () => {};` before the concatenated source. These are referenced by `listenerGlobal.js` but have their real implementations elsewhere or were removed
3. **Webstore description generation** — extracts the Features section from `README.md`, converts markdown to plain text (strips emoji, bold markers, table formatting), and writes `webstore-description.txt`
4. **Browser manifest generation** — reads `src/manifest.json` as the base (Chrome V3), then generates:
   - **Chrome** — copied as-is with `update_url`
   - **Firefox** — downgraded to V2: `action`→`browser_action`, `background.service_worker`→`background.scripts` (array), `host_permissions` merged into `permissions`, `web_accessible_resources` flattened to string array, `update_url` removed
   - **Edge** — same as Chrome but without `update_url`
5. **ZIP packaging** — copies `src/` into temp directories, overlays browser-specific manifests, creates zips using `archiver` at `build/boomi-xcel-{version}-{Browser}.zip`
6. **Watch mode** — `--watch` flag enables esbuild watch with `sourcemap: "inline"` for real-time development
7. **Release automation** — `--release` flag creates a GitHub release via `gh release create` with auto-generated notes from git commit messages grouped by conventional commit type

### jQuery Upgrade

**OLD:** jQuery 3.6 (`src/library/jquery/jquery-3.6.min.js`)
**Current:** jQuery 4.0 (`src/library/jquery/jquery-4.0.0.min.js`)

The old jQuery 3.6 file is preserved in the repo at `src/library/jquery/jquery-3.6.min.js` for reference but is not loaded by the manifest.

### Third-Party Libraries Added

Two libraries added to `content_scripts[0]` (loaded at `document_start`):
- **showdown.min.js** (`src/library/inject/showdown.min.js`) — Markdown-to-HTML converter, used for rendering markdown in content scripts
- **rasterizeHTML.min.js** (`src/library/inject/rasterizeHTML.min.js`) — HTML-to-image renderer, used by the process flow capture feature

---

## New Features

### Quick-Settings Popup

**Files:** `src/popup/popup.html` (29 lines), `src/popup/popup.js` (92 lines), `src/popup/popup.css` (165 lines)

**Manifest entry:** `src/manifest.json` line 7-14:
```json
"action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
        "16": "icon16.png",
        "48": "icon48.png",
        "128": "icon128.png"
    }
}
```

Previously, clicking the toolbar icon did nothing (no `action` key existed). Now it opens a 330px-wide popup panel with:

- **Header** — BoomiXcel logo (icon48.png), name, version number
- **8 toggle switches** — each renders as a `<label class="toggle"><input type="checkbox"><span class="slider"></span></label>` slider. Toggles read their state directly from `chrome.storage.sync.get(null)` and write immediately on change. The toggle list is defined in `TOGGLE_LIST` constant in `popup.js`:

| Storage Key | Label | Default |
|-------------|-------|---------|
| `canvas_grid` | Show Canvas Grid | `"on"` |
| `brand_logo` | Replace Boomi Brand Logo | `"off"` |
| `schedule_icon` | Old-Style Play/Pause Icons | `"off"` |
| `reverse_modal` | Reverse Modal Buttons (OK/Cancel) | `"off"` |
| `mastfoot_show` | Show Boomi Footer | `"on"` |
| `unique_titles_and_favicons` | Unique Page Titles & Favicons | `"on"` |
| `apply_process_filters` | Default Process Filters | `"off"` |
| `reminder_schedule` | Post-Deployment Schedule Reminder | `"on"` |

- **Footer** — two buttons:
  - "Full Settings" — calls `chrome.runtime.openOptionsPage()` to open the complete options page in a new tab
  - "Reload Page" — calls `chrome.tabs.reload()` on the active tab and closes the popup

- **Suppress flag** — before writing to `chrome.storage.sync`, the popup sets `bph_suppress_reload_dialog: true` in `chrome.storage.local`. The content script's `onChanged` listener checks this flag and skips the "Settings Changed" modal when set, since the popup has its own Reload button.

- **Default fallback** — when a storage key hasn't been saved yet (first-time user), the toggle defaults to its `defaultVal` from `TOGGLE_LIST`, matching the options page's `data-default` attributes.

### Brand Logo Replacement

**File:** `src/library/boomiapp/content/brandLogo.js`

Replaces the Boomi masthead logo with the BoomiXcel logo when the `brand_logo` config option is `"on"`. The script:
- Defines `LOGO_SELECTOR` = `'[data-locator="header-brand-logo"]'` for the target element
- Defines `LOGO_URL` = `chrome.runtime.getURL("logo/XcelLogo.png")` for the replacement image
- Polls in 300ms intervals (up to 30 attempts) waiting for `BoomiPlatform` to be populated by `listenerGlobal.js`
- When the config is available and the option is enabled, replaces the logo `src` attribute

Config key: `brand_logo` (reads from `BoomiPlatform.brand_logo` in bundle scope).

### Platform Status with Colored Dot Indicator

**File:** `src/library/boomiapp/content/contentScript.js` lines 18-36

Previously, the platform status link text was replaced with inline-styled `<b>` tags:
```html
<!-- OLD -->
<b>Platform Status: </b><b style="color: green;"> All Operational</b>
```

Now uses a CSS-driven approach with status dots:
```html
<!-- Current -->
<a href="https://status.boomi.com/" target="_blank">
  <span class="bph-status-dot bph-status-none"></span>
  <span class="bph-status-label">Platform Status:</span>
  <span class="bph-status-text bph-status-none">All Systems Operational</span>
</a>
```

The status indicator is read from `out.status.indicator` in the `https://status.boomi.com/api/v2/status.json` response. The indicator value maps to a CSS class:

| Indicator | CSS Class | Dot Color | Text Color |
|-----------|-----------|-----------|------------|
| `none` | `bph-status-none` | Green `#2e7d32` | Green `#2e7d32` |
| `minor` | `bph-status-minor` | Orange `#e65100` | Orange `#e65100` |
| `major` | `bph-status-major` | Red `#c62828` | Red `#c62828` |
| `critical` | `bph-status-critical` | Red `#c62828` | Red `#c62828` |
| `maintenance` | `bph-status-maintenance` | Blue `#1565c0` | Blue `#1565c0` |

CSS rules in `src/library/css/boomi.css`:
```css
.bph-status-dot {
  display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; margin-right: 4px;
  vertical-align: middle; position: relative; top: -1px;
}
.bph-status-dot.bph-status-none   { background: #2e7d32; }
.bph-status-dot.bph-status-minor  { background: #e65100; }
.bph-status-dot.bph-status-major  { background: #c62828; }
/* ...etc */
```

The fragile XPath selector `//a[text()='Platform Status & Announcements']` was replaced with the more robust CSS selector `a[href*="status.boomi.com"]`. If the link text changes on Boomi's side, the selector will still work as long as the link points to `status.boomi.com`.

### Footer Bar Text

**File:** `src/library/boomiapp/content/contentScript.js` line 40

```
OLD: Boomi Platform Enhancer v1.8.0.0 loaded [options]
NEW: BoomiXcel v1.8.0.0 · Options
```

Changes:
- Dropped "loaded" noise word
- Replaced `[options]` raw brackets with middot separator (`·`) and capitalized "Options"
- Added null guard: `document.getElementById("footer_links")` wrapped in `if (footerLinks)` to prevent TypeError on pages without a footer bar

### Page-Specific Favicons & Titles

**File:** `src/library/boomiapp/content/favicon.js` (119 lines)

This feature was previously present but broken for the new Boomi UI. Key improvements:

**SVG icon selection logic:**
- `getPageNameWithoutExtension()` extracts the page name from the URL path (e.g., `"AtomSphere"` from `/AtomSphere.html`, `"build"` from `/build`)
- `getGWTPageName()` extracts the GWT page name from the URL hash for old UI pages
- `window.location.host.split(".")[0]` determines the subdomain (`"platform"`, `"flow"`, etc.)

**Switch hierarchy:**
```
subdomain → platform:
  pageName → AtomSphere:
    gwtPage → atom → AtomSphere SVG
    gwtPage → default → generic AtomSphere SVG
  pageName → MdmSphere → MdmSphere SVG
  pageName → ApiSphere → ApiSphere SVG
  pageName → default → generic AtomSphere SVG (covers new UI URLs like /build)
subdomain → flow → Flow SVG
subdomain → default → generic AtomSphere SVG (covers unknown subdomains)
```

**Favicon update mechanism** (`changeFaviconImage`):
Previously mutated an existing `<link>` element's `href`, which browsers cache aggressively and may not refresh. Now:
1. Removes all existing `<link>` elements with `data-bph-favicon` attribute
2. Creates a fresh `<link rel="icon" data-bph-favicon="true">` element
3. Sets its `href` to the data URI
4. Appends to `<head>`

This forced recreation ensures the browser re-renders the tab icon.

**Data URI format fix:**
```js
// OLD (broken): space produced " <svg..." (invalid XML)
"data:image/svg+xml, " + svgIcon
// Current (fixed):
"data:image/svg+xml," + svgIcon
```

**Page title:** `removeAccountPrefixFromDocumentTitle()` removes the account name prefix from `document.title` using the account element found via `.qm-c-inlinemenu__settings-menu-item-name` class.

### Shared Modal Dialog Helper

**File:** `src/library/boomiapp/content/modalHelper.js` (83 lines)

Consolidates Boomi-style modal dialog rendering that was previously duplicated across multiple files.

**`renderBoomiModal(options)`** — accepts:
- `overlayClass` — CSS class for the overlay div (e.g., `"BoomiUpdateOverlay"`)
- `body` — HTML string for the modal body
- `buttons` — array of `{ id, className, text }` objects for action buttons
- `width` — optional width (default `"400px"`)
- `extraPopupClasses` — additional classes for the popupContent div
- `showInfoIcon` — whether to show the info SVG icon from `svgAssets.js`

Returns an HTML string for a complete modal dialog with Boomi's standard structure: overlay → center_panel → popupContent → margin_popup_contents → notification_min_width.

**`removeBoomiOverlay(className)`** — removes existing modal overlays by class name.

**Consumers:**
- `contentScript.js:92` — settings-changed dialog
- `updateNotification.js:36` — per-version changelog popup
- `imageCapture.js:24` — capture options dialog

### Shared Toast Notification Helper

**File:** `src/library/boomiapp/content/toastHelper.js` (19 lines)

**`showToast(message, duration, type)`** — creates a temporary toast notification:
- Default duration: 3000ms
- Appends a `<div class="bph-toast show">` container to the toast wrapper (creates one if it doesn't exist)
- Slides in from the right via CSS transition
- Auto-removes after duration
- Supports `"error"` type for red styling (`.bph-toast-error`)

**Consumers:**
- `global.js:69` — `showInformationAlertDialog()` calls `showToast`
- `options.js:91` — save confirmation toast on the options page
- Loaded directly via `<script src="...toastHelper.js">` on `options.html:132`

### Copy Document Content Button

**File:** `src/library/boomiapp/content/copyDocument.js` (90 lines)

Previously used inline `style.cssText` for button and tooltip styling. Now uses CSS classes:

**CSS classes** (`src/library/css/boomi.css`):
```css
.bph-copy-container { position: relative; }
.bph-copy-btn {
  position: absolute; bottom: 8px; right: 8px;
  background: none; border: none; padding: 4px 6px;
  cursor: pointer; color: inherit; opacity: 0.6;
  display: flex; align-items: center; gap: 4px; font-size: 12px;
}
.bph-copy-btn-hover { opacity: 1; }
.bph-copy-tooltip {
  position: absolute; bottom: calc(100% + 6px); right: 0;
  background: rgba(0,0,0,0.75); color: #fff;
  font-size: 11px; white-space: nowrap;
  padding: 3px 7px; border-radius: 3px;
  pointer-events: none; opacity: 0; transition: opacity 0.15s;
}
.bph-copy-tooltip-visible { opacity: 1; }
```

Uses shared SVG icons `SVG_COPY_ICON` and `SVG_CHECK_ICON` from `svgAssets.js` instead of duplicated inline definitions.

### Options Page Enhancements

**Dirty indicator:** A yellow dot (`.dirty-dot`) appears next to the page title and "Save Options" button when the form has unsaved changes. Implemented in `options.js` via `getFormState()` / `isDirty()` / `updateDirtyIndicator()`.

**Reset button:** A "↺ Reset" button restores all form controls to their `data-default` attributes. Shows a confirmation dialog, then a toast notification on completion.

**Collapsible groups:** Options are organized in `<details class="option-group" open>` sections: Appearance, Build Canvas, Process Reporting, Navigation & Shortcuts, Reminders. All groups open by default.

**Toggle switches:** All on/off checkboxes now use the slider-style toggle pattern (`<label class="toggle"><input type="checkbox" class="option toggle-input"><span class="slider"></span></label>`) matching the toolbar popup. Serialized as `"on"`/`"off"` strings by `options.js`.

### Endpoint Glow & Quick-Add Stop Shape

**File:** `src/library/boomiapp/content/endpointGlow.js`

- Non-connected endpoints (shapes with unconnected connectors) glow for visibility using a CSS pulse animation
- Hovering over a glowing endpoint shows a quick-add Stop shape button
- Configurable via `endpoint_flash` option: `"on"` (always visible), `"off"` (disabled), `"testing"` (only when running tests)

### View in Process Reporting Quick-Link

**File:** `src/library/boomiapp/content/headerActions.js` lines 110-131

A quick-link icon appears next to the Description link on the build canvas, taking you directly to the Process Reporting page for the current component. Parses the component ID from the URL and constructs the reporting URL.

### Automated GitHub Releases

**Implementation:** `scripts/build.js` — `createGitHubRelease()` and `generateReleaseNotes()` functions

**Trigger:** `npm run release` or `node scripts/build.js --release`

**Process:**
1. Runs the normal build (bundle + webstore description + 3 browser zips)
2. Finds the most recent `v*` git tag via `git describe --tags --abbrev=0 --match "v*"`
3. Gets all non-merge git commits between that tag and HEAD via `git log {tag}..HEAD --no-merges --pretty=format:%s`
4. Categorizes each commit by conventional commit prefix into groups:
   - `feat:` → Features
   - `fix:` → Bug Fixes
   - `docs:` → Documentation
   - `style:` → Styling & UI
   - `refactor:` → Refactoring
   - `chore:` → Maintenance
   - Everything else → Other Changes
5. Formats release notes as markdown with categorized sections
6. Adds a full changelog compare URL at the bottom
7. Creates the GitHub release via `gh release create v{version} --title "BoomiXcel v{version}" --notes "..." build/*.zip`
8. All 3 browser zips are automatically attached as release assets

**Requirements:** `gh` CLI installed and authenticated (`gh auth login` or `GITHUB_TOKEN` environment variable).

### Watch Mode with Source Maps

`npm run watch` (alias for `node scripts/build.js --watch`) enables esbuild's watch mode with `sourcemap: "inline"`. On file changes, the bundle is automatically rebuilt. Stack traces in DevTools show original source filenames (esbuild injects `// src/library/boomiapp/content/...` comments).

### Webstore Description Auto-Generation

The build script parses the README Features section and converts it to plain text for the Chrome Web Store and Firefox Add-ons listing. The process:
1. Reads `README.md` as UTF-8 (auto-handles Windows `\r\n`)
2. Normalizes line endings: `\r\n` → `\n`
3. Extracts the section between `## ✨ Features` and the next `## ` heading via regex: `/## [^\n]*Features\n([\s\S]*?)\n(?=## )/`
4. Strips HTML tags and emoji characters
5. Converts bold markers (`**text**` → `text`)
6. Converts markdown tables to indented lists
7. Converts category headers to uppercase
8. Collapses multiple blank lines to single line
9. Removes "↑ Back to top" navigation links
10. Prepends version header and appends disclaimer

### Shields.io Badges

README header now uses dynamic badges from [shields.io](https://shields.io) instead of static PNG files:
- Version badge — reads from GitHub releases
- License badge
- GitHub stars badge
- Chrome Web Store users badge
- Firefox Add-on users badge

---

## Features Removed

| Feature/File | Reason for Removal |
|-------------|-------------------|
| `webRequest` permission (`src/manifest.json`) | No feature required it. Reduces the extension's permission surface. |
| `src/library/inject/shortcut.js` | Replaced by native `addEventListener("keydown")` in `keyboardShortcuts.js` and `fullscreen.js`. Shortcut handling is now entirely vanilla JS. |
| Bootstrap popover on options page | The disclaimer popover (requiring `popper.js` and `bootstrap.js`) was replaced with a static yellow Bootstrap alert banner, removing two script dependencies. |
| Inline base64 SVG logo on `options.html` | Replaced by `<img src="logo/XcelLogo.png">` with CSS class `.options-logo`. |
| `notes.js` and `descriptionMarkdown.js` content scripts | Boomi platform now handles markdown rendering natively. The old scripts added markdown support to note shapes, which is no longer needed. |
| `boomi.js` content script | Functionality merged into `headerActions.js`, `dashboard.js`, and other scripts. |
| `clickComponents.js` | Merged into `shapePopup.js` and `shapePalette.js`. |
| Static `Manifest/` directory (3 files) | Replaced by `scripts/build.js` generating manifests from `src/manifest.json` dynamically. |
| `WebStore Text.md` (static, 44 lines) | Replaced by auto-generated `webstore-description.txt` from the build step. |
| Static store badge PNGs (5 files): `chrome-web-store-badge.png`, `chrome-web-store-badge-border.png`, `firefox-add-on-badge.png`, `firefox-add-on-badge-border.png`, `firefox-add-on-badge-border-resized.png` | Replaced by shields.io dynamic SVG badges in the README. |
| `src/library/css/blocks.css` (options page stylesheet) | Merged into `boomi.css` under the `/* Options page */` section. Single stylesheet convention. |
| OLD `build/` zip artifacts (68 files) | Replaced by 3 auto-generated zips. |
| `build/updateNotification.js` (build artifact) | Per-version changelog now handled by `content/updateNotification.js` using `localStorage`. |

---

## Bug Fixes

### 1. Firefox Manifest Generator — Non-Functional Build (Critical)

**File:** `scripts/build.js` — `generateFirefoxManifest()` function

The OLD build script's Firefox manifest generator only changed `manifest_version` to 2, deleted `update_url`, and flattened `web_accessible_resources`. It did NOT convert any MV3 keys to their MV2 equivalents, making the Firefox build completely non-functional.

**Missing conversions (now fixed):**

| MV3 Key | MV2 Key | Conversion |
|---------|---------|------------|
| `action` | `browser_action` | Rename key + delete `action` |
| `background.service_worker` | `background.scripts` | Wrap in array: `{ scripts: [worker_path] }` |
| `host_permissions` | (merged into `permissions`) | `permissions.concat(host_permissions)` |

**Current `generateFirefoxManifest` code:**
```js
function generateFirefoxManifest(base) {
  const manifest = clone(base);
  manifest.manifest_version = 2;
  delete manifest.update_url;
  if (manifest.action) {
    manifest.browser_action = manifest.action;
    delete manifest.action;
  }
  if (manifest.background?.service_worker) {
    manifest.background = { scripts: [manifest.background.service_worker] };
  }
  if (manifest.host_permissions) {
    manifest.permissions = (manifest.permissions || []).concat(manifest.host_permissions);
    delete manifest.host_permissions;
  }
  if (manifest.web_accessible_resources?.[0]?.resources) {
    manifest.web_accessible_resources = manifest.web_accessible_resources[0].resources;
  }
  return manifest;
}
```

**Verification:** The generated Firefox manifest now contains:
- `"manifest_version": 2`
- `"browser_action": { "default_popup": "...", "default_icon": {...} }`
- `"background": { "scripts": ["background.js"] }`
- `"permissions": ["storage", "downloads", "https://platform.boomi.com/*"]`
- `"web_accessible_resources": ["*.png", "*.jpg", "library/boomiapp/page/fullscreen.js"]`

### 2. Webstore Description Generator — Broken Regex (Critical)

**File:** `scripts/build.js` — `generateWebstoreDescription()` function

**Issue 1:** The regex `## Features\n` did not match `## ✨ Features` (emoji in heading). The build output showed `"Skipping webstore description: Features section not found"` and the generated `webstore-description.txt` contained garbled/incomplete content.

**Fix:** Changed to `## [^\n]*Features\n` to match any heading containing "Features" regardless of emoji.

**Issue 2:** After the Features section no longer ended with `---` (removed during README reordering), the regex `([\s\S]*?)\n---` matched the next `---` in the document (under the Installing section), pulling too much content.

**Fix:** Changed the boundary to `(?=## )` — a lookahead for the next `##` heading.

**Issue 3:** Windows line endings (`\r\n`) caused the regex `\n{3,}` (collapse blank lines) to not match correctly, producing too many blank lines in the output. Also, `$` anchor in multiline mode didn't match correctly with `\r\n`.

**Fix:** Added normalization at the top of the function: `features = readme.replace(/\r\n/g, "\n")`. This ensures all subsequent regex operations produce identical results on Windows, macOS, and Linux.

### 3. Undefined `overlay` Variable (High)

**File:** `src/library/boomiapp/content/contentScript.js` line 105 (OLD)

```js
// OLD (broken):
removeBoomiOverlay("BoomiUpdateOverlay");
if (overlay) overlay.remove();  // 'overlay' is not defined
document.getElementsByTagName("body")[0].insertAdjacentHTML("beforeend", alert_html);
```

The variable `overlay` was never declared or assigned. `removeBoomiOverlay("BoomiUpdateOverlay")` already handles the cleanup on the line above. Removed the dangling `if (overlay) overlay.remove()` line.

### 4. Null Guard on Footer Injection (High)

**File:** `src/library/boomiapp/content/contentScript.js` line 39

```js
// OLD (could throw):
document.getElementById("footer_links").insertAdjacentHTML(...)

// Current (safe):
var footerLinks = document.getElementById("footer_links");
if (footerLinks) {
  footerLinks.insertAdjacentHTML("afterbegin", ...);
  document.getElementById("bph-options-link")?.addEventListener("click", ...);
}
```

On pages without a footer (`footer_links` element), the code would throw a TypeError. The `if (footerLinks)` guard prevents this, and the event listener uses optional chaining (`?.`) for safety.

### 5. Orphaned CSS Rules (High)

**File:** `src/library/css/boomi.css` lines 39-41 (OLD)

During an earlier edit to insert status dot CSS, duplicate brand-logo rules were created without a selector:
```css
  height: 30px !important;
  width: auto !important;
}
```
These orphaned rules were removed. The actual `.bph-brand-logo` rule at lines 10-13 remains intact.

### 6. Duplicate `Connector` Key in iconSets.js (High)

**File:** `src/library/boomiapp/content/iconSets.js` lines 203 and 226

The `minimalInvertedIconStyleColorCodes` object had `Connector: "#1B72C3"` declared twice — once at line 203 (correct) and once at line 226 (left uncommented while surrounding lines were commented). Values were identical, so runtime behavior was unaffected, but esbuild emitted a persistent warning: `Duplicate key "Connector" in object literal [duplicate-object-key]`.

Removing the duplicate eliminated the build warning. The build now runs silently (no warnings).

### 7. SVG Icon Duplication (High)

**Files:** `src/library/boomiapp/content/copyDocument.js` and `src/library/boomiapp/content/svgAssets.js`

`copyDocument.js` defined two SVG icon variables at the top of the file that were identical to those already defined in `svgAssets.js`:

| copyDocument.js (OLD) | svgAssets.js | Identical? |
|------------------------|--------------|------------|
| `var copySvg` = copy icon SVG string | `var SVG_COPY_ICON` = same SVG string | Yes |
| `var checkSvg` = check icon SVG string | `var SVG_CHECK_ICON` = same SVG string | Yes |

**Fix:** Removed the local `copySvg` and `checkSvg` variables from `copyDocument.js`. References throughout the file replaced with `SVG_COPY_ICON` and `SVG_CHECK_ICON`. Since `svgAssets.js` is earlier in `CONTENT_ORDER` (index 2 vs index 33), the variables are available in the IIFE scope.

### 8. Popup Toggle Defaults (High)

**File:** `src/popup/popup.js` line 18-19

```js
// OLD (broken for first-time users):
var val = items[item.key];
var enabled = val === "on" || val === true;
```

When a storage key had never been saved (first-time installation, or a new toggle added), `items[item.key]` returned `undefined`. `undefined === "on"` is `false`, and `undefined === true` is `false`. So ALL toggles appeared OFF, even for features that should default to ON (canvas grid, footer, favicons, schedule reminder).

```js
// Current (fixed):
var val = items[item.key];
if (val === undefined) val = item.defaultVal;
var enabled = val === "on" || val === true;
```

Each toggle's `defaultVal` in `TOGGLE_LIST` matches the `data-default` attribute on the corresponding options page control, so both interfaces show the same default state.

### 9. Settings-Changed Modal Firing from Popup (High)

**Files:** `src/popup/popup.js` and `src/library/boomiapp/content/contentScript.js`

**Problem:** The popup has its own "Reload Page" button after changing toggles. But changing a toggle also triggered the "Settings Changed — Reload" modal in the content script, duplicating the reload prompt.

**Root cause:** `chrome.storage.onChanged` fires for ALL storage areas — both `sync` and `local`. When the popup wrote its suppress flag to `local` storage, the listener fired, checked the flag, found it, cleared it, and returned. Then when the actual sync change arrived, the flag was already gone.

**Fix:**
1. Popup now writes `bph_suppress_reload_dialog: true` to `chrome.storage.local` in a callback, then writes the setting to `chrome.storage.sync` only after the local write completes:
   ```js
   chrome.storage.local.set({ bph_suppress_reload_dialog: true }, function () {
     chrome.storage.sync.set(data);
   });
   ```
2. Content script's `onChanged` listener now filters to `sync` area only:
   ```js
   chrome.storage.onChanged.addListener((changes, areaName) => {
     if (areaName !== "sync") return;
     // ...
     chrome.storage.local.get(["bph_suppress_reload_dialog"], function (local) {
       if (local.bph_suppress_reload_dialog) {
         chrome.storage.local.remove("bph_suppress_reload_dialog");
         return; // suppress
       }
       // show modal
     });
   });
   ```

### 10. `buildFilters.js` Race Condition (Medium)

**File:** `src/library/boomiapp/content/buildFilters.js`

The old code made 5 separate `chrome.storage.sync.get()` calls, each with its own callback. Since JavaScript callback ordering is non-deterministic for separate async operations, the 5th callback (which read `apply_process_filters` and then checked the checkbox values from callbacks 1-4) could fire BEFORE the earlier callbacks, accessing `undefined` variables.

**OLD (5 separate calls):**
```js
var processFilter, processPropFilter, CrossFilter;
chrome.storage.sync.get(["Filter_process"], function (e) { processFilter = e.Filter_process; });
chrome.storage.sync.get(["Filter_processProp"], function (e) { processPropFilter = e.Filter_processProp; });
chrome.storage.sync.get(["Filter_crossref"], function (e) { CrossFilter = e.Filter_crossref; });
chrome.storage.sync.get(["Filter_api_service"], function (e) { APIServFilter = e.Filter_api_service; });
chrome.storage.sync.get(["apply_process_filters"], function (e) {
  if (e.apply_process_filters === "on") {
    // Uses processFilter, processPropFilter, CrossFilter, APIServFilter — could be undefined!
  }
});
```

**Current (1 combined call):**
```js
chrome.storage.sync.get([
  "Filter_process", "Filter_processProp", "Filter_crossref",
  "Filter_api_service", "apply_process_filters",
], function (e) {
  if (e.apply_process_filters !== "on") return;
  // All values available atomically in 'e'
  document.getElementById(matchingprocess.htmlFor).checked = e.Filter_process;
  document.getElementById(matchingproprop.htmlFor).checked = e.Filter_processProp;
  document.getElementById(matchingxref.htmlFor).checked = e.Filter_crossref;
  document.getElementById(matchingapiserv.htmlFor).checked = e.Filter_api_service;
});
```

### 11. `updateNotification.js` Dead Call (Medium)

**File:** `src/library/boomiapp/content/updateNotification.js` line 9 (OLD)

```js
// OLD: called but result discarded
localStorage.getItem("boomiplatenhanUpdateNot" + currentAppver);
if (localStorage.getItem("boomiplatenhanUpdateNot" + currentAppver) === null || ...
```

The first `getItem()` call served no purpose — its return value was discarded. Removed. Only the second call (with the `if` check) remains.

### 12. Implicit Globals (Medium)

**Files:** `src/library/boomiapp/content/listenerGlobal.js` and `src/library/boomiapp/content/favicon.js`

Two variables were assigned without a declaration keyword (`var`, `let`, or `const`). In non-strict mode, this creates properties on the `window` object. If strict mode is ever enabled, these assignments throw `ReferenceError`.

| Variable | File | Fix |
|----------|------|-----|
| `dynamicShapeIconStyleData` | `listenerGlobal.js` line 14 | Added `var dynamicShapeIconStyleData = "";` at the top of the file (alongside `var BoomiPlatform = {};`) |
| `iconHrefData` | `favicon.js` line 93 | Changed to `var iconHrefData` inside `changeFaviconToSVG()` |

### 13. Favicons Not Updating (Medium)

**File:** `src/library/boomiapp/content/favicon.js`

Three separate issues prevented favicons from displaying:

**Issue A — New Boomi UI URL patterns:** The new Boomi platform uses URLs like `/build` or `/X-XXXX/build` instead of the old `/AtomSphere.html#build;...` pattern. `getPageNameWithoutExtension()` returned `"build"` from these URLs, which matched no case in the `changeFaviconBasedOnPage()` switch statement. `svgIcon` remained empty, so no favicon was ever set.

**Fix A:** Added `default` cases at both the pageName level (inside `case "platform"`) and the subdomain level, falling back to the generic AtomSphere SVG icon for any unrecognized page or subdomain.

**Issue B — Invalid data URI:** The data URI had a space after the comma:
```
"data:image/svg+xml, %3Csvg..."  → decodes to " <svg..." (leading space = invalid XML)
```
**Fix B:** Removed the space: `"data:image/svg+xml," + svgIcon`

**Issue C — Browser favicon caching:** Mutating an existing `<link>` element's `href` attribute never triggers a browser tab icon refresh in some browsers.

**Fix C:** Rewrote `changeFaviconImage()` to always:
1. Query for and remove all previous `<link rel="icon">` elements marked with `data-bph-favicon`
2. Create a fresh element with `rel="icon"` and `data-bph-favicon="true"`
3. Set `href` to the data URI
4. Append to `<head>`

### 14. `#close` → `#bph-close-notification` (Low)

**Files:** `src/library/boomiapp/content/versionNotification.js` and `src/library/css/boomi.css`

The ID `#close` was used for the revision notification close button. This is a common ID that could collide with other page elements. Renamed to `#bph-close-notification` with the `bph-` prefix for namespace isolation. Updated the CSS from:
```css
#close { float:right; display:inline-block; padding:2px 5px; background:#ccc; }
#close:hover { /*...*/ }
```
to:
```css
#bph-close-notification { float:right; display:inline-block; padding:2px 5px; background:#ccc; }
#bph-close-notification:hover { /*...*/ }
```

### 15. Stale Documentation References

| Reference | Location | Fix |
|-----------|----------|-----|
| `shortcut.js` as a bundled library | README Built With, AGENTS Key Libraries, README architecture table | Removed — library is no longer in use |
| `boomi.js` calling global.js functions | AGENTS.md line 31 | Updated to `dashboard.js, pageInit.js` |
| Discord channel `#extension-enhancer` | README Discussion section | Updated to `#boomi-xcel` |
| `scripting` permission in README FAQ | README permissions table | Removed — not in manifest (uses declared content_scripts) |
| No external requests claim | PRIVACY.md line 7 | Updated to document the `status.boomi.com` API call |

### 16. PRIVACY.md Accuracy

**File:** `PRIVACY.md`

The old text claimed "the only external requests made are those already present on your Boomi platform page." However, `contentScript.js` explicitly fetches `https://status.boomi.com/api/v2/status.json` on every page load to display the platform operational status.

Updated to: "The only external request made by the extension is a single call to `status.boomi.com` to display the Boomi platform operational status in the footer. No data is sent in this request."

---

## Styling & UI

### Options Page Redesign

**File:** `src/options.html` (135 lines) and `src/library/boomiapp/options.js` (102 lines)

The options page underwent a complete visual and functional redesign.

**Layout changes:**
- **OLD:** Full-page dark teal background (`#033d58`), Bootstrap `bg-dark rounded-3` card with a left sidebar containing the logo and disclaimer
- **Current:** White centered card (`max-width: 720px`, border-radius: 8px) on the dark teal background. Logo centered at top. Disclaimer as a yellow Bootstrap `alert-warning` banner at top.

**Form control changes:**
- **OLD:** All controls were `<select>` dropdowns with a popover-triggered disclaimer
- **Current:** Mix of slider toggle switches (for on/off options), `<select>` dropdowns (for multi-choice options), and regular checkboxes (for filter selection). No popovers.

**Grouping changes:**
- **OLD:** Flat list of controls
- **Current:** Collapsible `<details class="option-group" open>` sections: Appearance, Build Canvas, Process Reporting, Navigation & Shortcuts, Reminders

**Button changes:**
- **OLD:** Single "Save Options" button, no reset
- **Current:** "Save Options" button + "↺ Reset" button in a sticky footer bar

**Dirty indicator:**
- **OLD:** None
- **Current:** Yellow dot appears next to title and save button when unsaved changes exist. Implemented via `getFormState()` comparing current values against `SAVED_STATE`.

**JavaScript dependencies:**
- **OLD:** jQuery 3.6, popper.js, bootstrap.js (for popover), `options.js`
- **Current:** `toastHelper.js`, `options.js`

### Toggle Switches Unified

All toggle switches now use the same slider pattern across the options page and the toolbar popup:

```html
<label class="toggle">
  <input type="checkbox" class="option toggle-input" data-default="on">
  <span class="slider"></span>
</label>
```

CSS for both popup and options page toggles:
```css
.toggle { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 22px; transition: background 0.2s; }
.slider::before { content: ""; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
.toggle input:checked + .slider { background: #1B72C3; }
.toggle input:checked + .slider::before { transform: translateX(18px); }
```

`options.js` detects toggle inputs via `.toggle-input` class and serializes them as `"on"`/`"off"` strings (matching how `listenerGlobal.js` reads them).

### CSS File Changes

**File:** `src/library/css/boomi.css` — OLD: 496 lines → Current: 557 lines (+61 lines net)

**New styles added:**

| Selector | Lines | Purpose |
|----------|-------|---------|
| `.bph-brand-logo` | 10-13 | Custom masthead logo sizing (`height: 30px !important; width: auto !important`) |
| `.bph-status-dot` | 16-22 | Platform status colored dot (8px circle, inline-block, vertical-align) |
| `.bph-status-none/minor/major/critical/maintenance` | 24-28 | Color classes for status text |
| `.bph-status-dot.bph-status-*` | 30-35 | Background colors for status dots |
| `.options-logo` | 529 | Options page logo height (60px) |
| `.toggle`, `.toggle input`, `.slider`, `.slider::before` | 532-536 | Slider toggle switch styles |
| `.toggle input:checked + .slider` | 537-538 | Toggle active state |
| `.sticky-save` | 543-547 | Sticky save bar on options page |
| `.btn-reset` | 548-549 | Reset button styles with hover state |
| `.bph-copy-container` | 552 | Relative positioning context for copy button |
| `.bph-copy-btn` | 553-556 | Copy button appearance |
| `.bph-copy-btn-hover` | 557 | Copy button full opacity on hover |
| `.bph-copy-tooltip` | 558-562 | Copy button tooltip |
| `.bph-copy-tooltip-visible` | 563 | Tooltip visible state |
| `.bph-toast` | 565 | Toast notification container |
| `.bph-toast.show` | 566 | Toast visible state |
| `.bph-toast-error` | 567 | Error toast variant |

**Styles removed or cleaned:**
- `.svg-foreground` rule — no longer needed
- Large commented-out dark theme canvas grid variables block (~33 lines) — Boomi's own CSS provides these variables
- Dead `.ignoreBreaks` comment block
- `#close` / `#close:hover` renamed to `#bph-close-notification` / `#bph-close-notification:hover`
- Misc commented-out values within active rules

### CSS Conventions Enforced

- All static styles must be in `boomi.css` as classes. No inline `style=""` attributes or `element.style.*` in JS.
- Exception documented for computed/dynamic styles: positioning for drag operations, transform scaling for image capture, palette width resizing, and similar cases where the value is calculated at runtime and cannot be authored in CSS.
- All options page CSS lives under the `/* Options page */` section in `boomi.css`.

---

## Documentation

### New Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `AGENTS.md` | ~271 | Comprehensive developer reference: project summary, build pipeline, bundle scope behavior, two execution contexts, manifest, injection order, config flow, storage split, key libraries, script responsibilities table, browser store builds, deprecated code, refactoring rules, documentation sync rules, code style, CSS conventions, modal/toast helpers, options page form contract, rebuild scope, popup architecture |
| `USER_GUIDE.md` | 233 | End-user guide: installation, quick settings popup, options page, keyboard shortcuts, build canvas features, editing tools, navigation & layout, process reporting, appearance, download tools, notifications, footer & branding |
| `PRIVACY.md` | 13 | Privacy policy: data collection disclosure (none), permission justification, status.boomi.com API call documented |
| `SECURITY.md` | 40 | Vulnerability reporting process, scope, supported versions |
| `LICENSE` | 674 | GPLv3 full license text (replaces inline MIT from OLD) |
| `REFACTOR.md` | 400+ | This document — comprehensive project comparison |
| `.github/PULL_REQUEST_TEMPLATE.md` | 46 | PR template with description, related issue, type of change, browser/page testing checklists, contributing checklist, screenshot section |
| `.github/ISSUE_TEMPLATE/bug_report.md` | 40 | Bug report template: where it happened, version, browser, steps to reproduce, expected behavior |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 30 | Feature request template: affected Boomi page, problem, current workaround, desired solution, alternatives |
| `.github/ISSUE_TEMPLATE/config.yml` | 8 | Issue tracker config: disables blank issues, adds Discord + Boomi Community contact links |
| `.github/workflows/build.yml` | 45 | CI workflow (see CI/CD section) |
| `webstore-description.txt` | ~87 | Auto-generated from README Features section for browser store listings |

### README.md — Massive Expansion

**OLD:** 184 lines — basic project description, store install links, feature bullet list, manual install instructions, contributors table

**Current:** 519 lines — comprehensive project landing page:

| Section | Lines | Content |
|---------|-------|---------|
| Header | 1-45 | Logo, title, shields.io badges (version, license, stars, Chrome/Firefox users), install buttons, request feature link |
| Disclaimer | 47-48 | Boomi non-affiliation notice |
| Contents | 52-65 | 12-item table of contents |
| Features | 69-127 | 5 categorized feature groups: Keyboard Shortcuts, Build Canvas, Editing, Navigation & Layout, Process Reporting, Other, Quick Settings Popup |
| Installing | 130-147 | Chrome + Firefox store links with user count badges |
| Supported Browsers | 151-164 | Table: Chrome/Firefox/Edge/Brave/Opera/Arc with min versions, manifest versions, store links |
| User Guide | 168-171 | Link to `USER_GUIDE.md` |
| FAQ | 176-235 | 8 collapsible Q&As: affiliation, data, settings, bugs, changes not applying, updates, work-managed browsers, permissions |
| Development | 239-441 | Setup (prerequisites: Node.js, npm, gh CLI), Load extension, Build (all 4 steps), Project Structure diagram, Architecture (content vs page context, rule of thumb, configuration flow, storage backends), Conventions, Debugging, Script Reference (39 files), To release (with automated release docs), Built With |
| Contributing | 444-456 | Fork, branch, architecture guidance, testing, build, PR against main |
| Discussion | 458-461 | Discord invite |
| Privacy | 463-465 | No data collection statement + PRIVACY.md link |
| Security | 467-473 | SECURITY.md link |
| License | 475-479 | GPLv3 + LICENSE file link |
| Contributors | 481-510 | All-contributors table with avatars and role labels |

### AGENTS.md — Developer Reference

**Section breakdown:**

| Section | Lines | Content |
|---------|-------|---------|
| Project summary | 3-5 | What the project is |
| Build step | 7-41 | Commands, bundle scope behavior, IIFE sharing, listener callbacks |
| Two execution contexts | 43-49 | `content/` vs `page/` directories, rule of thumb for new scripts |
| Active manifest | 51-55 | Source of truth, web_accessible_resources |
| JS injection order | 57-60 | Bundle order, page context loading |
| Options / configuration | 62-82 | End-to-end config flow diagram, storage split (sync, local, localStorage) |
| Key libraries | 84-94 | jQuery 4.0, CodeMirror, arrive.js, showdown, rasterizeHTML |
| arrive.js cleanup pattern | 96-99 | Code example with unbindArrive |
| Script responsibilities | 101-142 | 36-row table of what each script does |
| Browser store builds | 144-159 | Build pipeline steps, version injection, release process |
| Deprecated code | 161-165 | Old scripts, do-not-modify rule |
| Refactoring rules | 167-173 | Copy-paste verbatim, verify before commit, when-in-doubt rule |
| Documentation sync | 175-201 | Rules for script/feature/library/section/browser changes + after-change review |
| Build script rules | 209-213 | Cross-platform regex, test on Windows, update all generators |
| Code style | 215-223 | Human-readable rule, var/const/let convention, no implicit globals |
| CSS convention | 225-232 | Single stylesheet, no inline styles, computed style exception |
| Modal dialogs | 234 | Use renderBoomiModal() |
| Toast notifications | 236 | Use showToast() |
| No linter | 238-242 | Test methodology, esbuild warnings non-fatal |
| Options form contract | 244-251 | class="option" + name attribute, listenerGlobal keys, TOGGLE_LIST for popup |
| Options page styling | 253-261 | boomi.css only, toggle switch pattern, select/input patterns |
| Rebuild scope | 263-269 | Which changes require rebuild |

---

## CI/CD & Build

### GitHub Actions CI Workflow

**File:** `.github/workflows/build.yml` (45 lines)

```yaml
name: Build
on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node-version }}, cache: "npm" }
      - run: npm ci
      - run: npm run build
      - name: Verify build artifacts
        run: |
          test -f build/boomi-xcel-*-Chrome.zip || exit 1
          test -f build/boomi-xcel-*-Firefox.zip || exit 1
          test -f build/boomi-xcel-*-Edge.zip || exit 1
      - name: Validate Firefox manifest
        run: |
          unzip -p build/boomi-xcel-*-Firefox.zip manifest.json | python3 -c "
          import json, sys
          m = json.load(sys.stdin)
          assert m['manifest_version'] == 2
          assert 'browser_action' in m
          assert 'scripts' in m.get('background', {})
          assert 'https://platform.boomi.com/*' in m.get('permissions', [])
          print('Firefox manifest OK')"
```

The CI runs on every push and PR to master/main, across Node.js 18, 20, and 22. It validates:
- The build succeeds with no errors
- All three browser zips are produced
- The Firefox manifest is structurally correct (MV2 format, proper key conversions, host permissions merged)

### npm Scripts

```json
{
  "scripts": {
    "build": "node scripts/build.js",
    "watch": "node scripts/build.js --watch",
    "release": "node scripts/build.js --release"
  }
}
```

### Build Process (`scripts/build.js` — ~398 lines)

| Step | Function | Description |
|------|----------|-------------|
| 1 | `bundleContent()` | Concatenates 36 content scripts in CONTENT_ORDER + stubs, bundles via esbuild → `content/bundle.js` |
| 2 | `generateWebstoreDescription()` | Parses README Features → plain text → `webstore-description.txt` |
| 3 | `readBaseManifest()` → browser generators | Reads `src/manifest.json`, generates Chrome/Firefox/Edge manifests |
| 4 | `createPackage()` | Copies `src/` → temp dir, overlays manifest, zips via archiver → `build/` |
| 5 | `createGitHubRelease()` (--release only) | Creates GitHub release with auto-generated commit-based notes |

---

## Security

### Permission Audit

| Permission | OLD | Current | Change |
|-----------|-----|---------|--------|
| `storage` | Yes | Yes | Unchanged |
| `downloads` | Yes | Yes | Unchanged |
| `webRequest` | Yes | **No** | Removed — not needed by any feature. Reduces attack surface. |
| `scripting` | No | No | Never needed — uses declared `content_scripts`, not programmatic injection |

### web_accessible_resources Reduction

**OLD (22 entries):**
```
notes.js, descriptionMarkdown.js, groups.js, shapes.js, fullscreen.js,
imageCapture.js, tableWrap.js, iconSets.js, listenerGlobal.js, canvas.js,
customRefresh.js, connectionOperations.js, versionNotification.js,
modalButtons.js, messageEditor.js, menuOpen.js, jquery-3.6.min.js,
rasterizeHTML.min.js, showdown.min.js, codeflask.js, *.png, *.jpg
```

**Current (3 entries):**
```
*.png, *.jpg, library/boomiapp/page/fullscreen.js
```

Reducing from 22 to 3 means the extension exposes far fewer internal scripts to web pages. Only the Fullscreen API script (which needs page context) and image assets are accessible from the page. All other scripts run in the isolated content-script sandbox.

### Dependency Security

esbuild bumped from `0.25.12` (capped at `^0.25.0`) to `0.28.1` (`^0.28.1`). This fixes:

- **GHSA-gv7w-rqvm-qjhr** — Missing binary integrity verification in Deno module enabling remote code execution via `NPM_CONFIG_REGISTRY` override. The fix adds integrity checks to both the npm install script (0.28.0) and the Deno install script (0.28.1).
- Also adds integrity checks to the fallback download path (0.28.0), verifying that the hash of the downloaded binary matches the expected hash for the release.

### host_permissions

Added explicit `host_permissions: ["https://platform.boomi.com/*"]`. In OLD, host access was implicit via `content_scripts[].matches`. Making it explicit improves transparency for users reviewing permissions.

---

## Code Quality

### Dead Code Removed

| Location | Code Removed | Reason |
|----------|-------------|--------|
| `contentScript.js:110-112` | `function openExensionOptionsPage() { window.open(chrome.runtime.getURL("options.html")); }` | Typo in name ("Exension"), never called, duplicated existing `chrome.runtime.sendMessage({type: "OPEN_OPTIONS"})` approach |
| `keyboardShortcuts.js:12-27` | 16-line comment block documenting 8 failed approaches for Ctrl+Alt+T test button | Condensed to 2 lines stating the feature was removed and why (event.isTrusted / GWT gesture guard) |
| `buildFilters.js:2` | `//debugger` | Leftover debug statement |
| `reminders.js:6` | `//debugger` | Leftover debug statement |
| `shapePalette.js:80` | `console.log("Old Shape Palette Expand Detected")` | Production console.log |
| `customRefresh.js:78` | `console.log("Refresh")` | Production console.log |
| `connectionOperations.js:30-31` | `//for later` + commented `largeLabels` code | Dead feature never implemented |
| `filterButtons.js:42` | `//document.querySelectorAll(".treeItemContent").forEach((el) => {` | Dead alternative approach |
| `filterButtons.js:67` | `//})` | Closing brace of dead block |
| `groups.js:99-100` | `// removed as adding pre to notes...` + commented `matched_node.querySelector...` | Stale rationale + dead code |
| `updateNotification.js:9` | `localStorage.getItem(...)` discard call | Called but result unused |
| `boomi.css:43-51` | 33-line commented-out dark/light theme canvas grid variable block | Variables now come from Boomi's own CSS |
| `boomi.css:269-271` | Commented-out `span.ignoreBreaks` rule | Dead CSS |
| `boomi.css:275` | `/*white-space: unset !important;*/` inside active rule | Dead alternate value |

### Refactoring

| Location | OLD | Current |
|----------|-----|---------|
| `contentScript.js:18-24` | XPath `//a[text()='Platform Status & Announcements']` — fragile to text changes | CSS selector `a[href*="status.boomi.com"]` — robust to text changes |
| `buildFilters.js:6-19` | 5 separate `chrome.storage.sync.get()` calls with non-deterministic callback order | 1 combined multi-key `get()` call |
| `copyDocument.js:1-8` | Duplicate SVG definitions (`copySvg`, `checkSvg`) | References `SVG_COPY_ICON` / `SVG_CHECK_ICON` from `svgAssets.js` |
| `copyDocument.js:25-56` | Inline `style.cssText` arrays for button and tooltip | CSS classes in `boomi.css` (`.bph-copy-btn`, `.bph-copy-tooltip`, etc.) |
| `options.html:14` | `<img ... style="height: 60px;">` | `<img ... class="options-logo">` |
| `versionNotification.js:12` | `id="close"` | `id="bph-close-notification"` |
| `iconSets.js:226` | Duplicate `Connector: "#1B72C3"` | Removed |

### Conventions Established & Documented

**`var`/`const`/`let`** (documented in both README.md and AGENTS.md):
- `var` required for top-level declarations referenced by OTHER files in the bundle (e.g., `var BoomiPlatform`, `var renderBoomiModal`, `var showToast`, all SVG icon variables, all icon set data objects, all listener callbacks)
- `const`/`let` preferred for file-local declarations
- Never use implicit globals (assignment without declaration keyword) — would break under strict mode

**CSS** (documented in both README.md and AGENTS.md):
- Static styles → `boomi.css` classes exclusively
- Computed/dynamic styles (positioning, transforms, palette resizing) → acceptable as `element.style.*` with documented exception
- No inline `style=""` in HTML
- Single stylesheet rule applies universally

**Build script** (documented in AGENTS.md):
- All regex operations must normalize line endings or handle `\r?\n`
- Must produce identical output on Windows, macOS, and Linux
- Test on Windows before merging; use `cmd /c "npm run build"` as PowerShell fallback
- When manifest structure changes, update all three browser generators

---

## Content Script Inventory

### New Files (no OLD equivalent)

| File | Lines | Purpose |
|------|-------|---------|
| `pageInit.js` | 38 | Page-load detection via title change, header visibility state, "Show/Hide Header" button injection |
| `favicon.js` | 119 | Page-specific favicons (AtomSphere/MdmSphere/ApiSphere/Flow), unique page titles, navigation state listeners, account prefix removal |
| `headerActions.js` | 131 | Header show/hide toggle, copy component ID/URL, update overlay close, View in Process Reporting quick-link |
| `brandLogo.js` | 38 | Replace Boomi masthead brand logo with BoomiXcel logo (configurable, polls for BoomiPlatform readiness) |
| `svgAssets.js` | 11 | Shared SVG icon strings: `SVG_INFO_ICON`, `SVG_COPY_ICON`, `SVG_CHECK_ICON` — used by modalHelper, copyDocument |
| `modalHelper.js` | 83 | `renderBoomiModal()` — Boomi-style modal dialog renderer; `removeBoomiOverlay()` — cleanup utility |
| `toastHelper.js` | 19 | `showToast(message, duration, type)` — slide-in toast notification, used in content scripts and options page |
| `endpointGlow.js` | 65 | Non-connected endpoint glow + hover-to-add Stop shape (configurable via `endpoint_flash` option) |
| `shapePopup.js` | 163 | Double-click quick-shape popup (evolved from OLD `quickclickComponent.js`) |
| `sqlEditor.js` | 55 | CodeMirror SQL editor for Database Operation shapes (evolved from OLD `dbsqlEditor.js`, archived in `.Old Scripts/`) |

### Renamed / Reorganized

| OLD File | Current File | Notes |
|----------|-------------|-------|
| `buildPallet.js` | `shapePalette.js` | Restored old-style shape connector palette, rewritten with resize observer |
| `shortCuts.js` | `keyboardShortcuts.js` | Keyboard shortcut handling, now vanilla JS (no shortcut.js dependency) |
| `quickclickComponent.js` | `shapePopup.js` | Double-click quick-shape popup, rewritten |
| `dbsqlEditor.js` | `sqlEditor.js` | SQL editor migrated; old copy archived in `.Old Scripts but want to keep/` |
| `build/updateNotification.js` | `updateNotification.js` | Per-version changelog popup moved into content bundle |

### Removed

| File | Reason |
|------|--------|
| `notes.js` | Boomi platform now handles markdown rendering natively in note shapes |
| `descriptionMarkdown.js` | Same reason — markdown no longer needs client-side rendering |
| `boomi.js` | Functionality merged into `headerActions.js`, `dashboard.js`, and `pageInit.js` |
| `clickComponents.js` | Merged into `shapePopup.js` and `shapePalette.js` |
| `shortcut.js` | Replaced by native `addEventListener("keydown")` in `keyboardShortcuts.js` and `fullscreen.js` |
| `blocks.css` | Options page styles merged into `boomi.css` |
| `dbsqlEditor.js` | Renamed to `sqlEditor.js` (old copy archived) |

### Moved from Page Context to Bundle

Previously loaded via `loadScript()` (ran in page context, no `chrome.*` access):
`canvas.js`, `customRefresh.js`, `connectionOperations.js`, `versionNotification.js`, `modalButtons.js`, `tableWrap.js`, `imageCapture.js`, `groups.js`, `iconSets.js`, `listenerGlobal.js`

Now all run in content-script context within the bundle IIFE. They have full access to `chrome.*` APIs and share scope with all other content scripts.

Only `src/library/boomiapp/page/fullscreen.js` remains in page context — Chrome restricts `element.requestFullscreen()` from the isolated world.

---

## Summary

| Metric | OLD (1.7.4.8) | Current (1.8.0.0) |
|--------|---------------|-------------------|
| **Content scripts** | 33 flat files | 36 bundled + 1 page-context |
| **Build artifacts** | 68 manual zips | 3 auto-generated zips |
| **Documentation files** | 1 (README only) | 7 (README, USER_GUIDE, AGENTS, PRIVACY, SECURITY, LICENSE, REFACTOR) |
| **CI/CD** | None | GitHub Actions (build + validate on push/PR) |
| **Issue/PR templates** | None | Bug report, feature request, PR template |
| **npm scripts** | None | build, watch, release |
| **New features** | — | 19 |
| **Bugs fixed** | — | 14 |
| **Code cleanups** | — | 22 |
| **Dead code lines removed** | — | ~100+ |
| **web_accessible_resources** | 22 | 3 |
| **Permissions** | 3 (storage, downloads, webRequest) | 2 (storage, downloads) |
| **jQuery** | 3.6 | 4.0 |
| **Dependencies** | None | esbuild 0.28.1, archiver 7.0.0 |
| **manifest source** | 3 static files | 1 file → 3 generated |
| **~Lines of code** | ~4,500 | ~5,200 + ~1,800 docs |
