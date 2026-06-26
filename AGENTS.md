# AGENTS.md

## Project summary

BoomiXcel — a browser extension (Chrome + Firefox) that injects JS/CSS into `https://platform.boomi.com/*` to enhance the Boomi integration platform's web UI.

## Popup

Clicking the extension toolbar icon opens a popup (`src/popup/popup.html`) with quick-access toggle switches for the most-used settings. Changes save immediately to `chrome.storage.sync`. The popup has three elements:

- **Toggle list** — rendered by `popup.js` from `TOGGLE_LIST` (on/off string values written directly to `chrome.storage.sync`)
- **Full Settings** button — calls `chrome.runtime.openOptionsPage()` to open the full options page
- **Reload Page** button — reloads the active Boomi tab so settings take effect

When adding a new on/off toggle, add its `{ key, label, defaultVal }` to `TOGGLE_LIST` in `popup.js`.

## Build step

```bash
npm install          # install esbuild
npm run build        # bundle content scripts → content/bundle.js + browser zips
npm run watch        # rebuild on file changes
npm run release      # same as build + creates a GitHub release with the zips
```

The `--release` flag (or `npm run release`) creates a GitHub release using the `gh` CLI. The release is tagged `v{version}` from `package.json`. Release notes are taken from `updateNotification.md` (the same file that feeds the in-app changelog) under a `## What's New in v{version}` heading, with a **Full Changelog** compare link (last `v*` tag → new version) appended; if `updateNotification.md` is empty/missing, a short fallback line is used instead. All build zips are attached as assets. Requires `gh auth login` or a `GITHUB_TOKEN` environment variable.

Content scripts in `src/library/boomiapp/content/` are bundled by esbuild into a single `src/library/boomiapp/content/bundle.js`, which is the only content-script entry in every manifest. The bundle order is defined in `scripts/build.js > CONTENT_ORDER`. If you add a new content script, add it to that array and run `npm run build`.

`bundle.js` is a build artifact — it's gitignored. The only page-context script is `page/fullscreen.js` (Fullscreen API requires page context); it is loaded individually via `loadScript()`.

The build also reads `updateNotification.md` and injects its changelog items as `var UPDATE_CHANGELOG_HTML` into the bundle. Edit this file before a release to update the in-app update notification content.

### Bundle scope behavior

esbuild wraps the bundle in an IIFE (`(() => { ... })()`). Functions and `var` declarations are scoped to that IIFE — they are shared between all content scripts inside the bundle but are **not** on `window`. This is how `global.js` functions (`getUrlpath()`, `dashboardDays()`, `getUrlParameter()`, `getGWTPageName()`, `showInformationAlertDialog()`, `getCodeMirrorEditorTheme()`) are callable from `pageInit.js`, `headerActions.js`, and other content scripts.

The `listenerGlobal.js` sets a `var BoomiPlatform = {}` in the bundle scope, reads config from `chrome.storage.sync.get()`, and all other scripts reference `BoomiPlatform.key` from this shared IIFE-scoped variable.

Some listener callbacks referenced by `listenerGlobal.js` are defined as no-op stubs in `build.js` because the real implementations run in a different context or were removed:
- `add_fullscreen_listener` — real implementation in `page/fullscreen.js` (page context)
- `add_notecontent_listener` — feature removed (Boomi platform now handles markdown natively)
- `add_dialog_listener` — defined in `listenerGlobal.js` but incomplete (captures dialog info but has no active behavior)

## Two execution contexts — enforced by directory structure

The code is split into two directories under `src/library/boomiapp/`:

- **`content/`** — scripts built into `bundle.js` that run in the extension's isolated sandbox.
- **`page/`** — contains only `fullscreen.js`, injected by `content/contentScript.js` via `loadScript()`. Runs in the page's own context because Chrome restricts the Fullscreen API (`element.requestFullscreen()`) from the isolated world. Receives config via a minimal `postMessage` from `contentScript.js`. Listed in `web_accessible_resources`.

**Rule of thumb for new scripts:**
- Almost everything → `content/` (then add to `CONTENT_ORDER` in `scripts/build.js`)
- Needs Fullscreen API or similar page-context-only browser APIs → `page/` (then add to `web_accessible_resources`)

## Active manifest

`src/manifest.json` is the **base manifest** (Manifest V3, Chrome). The build script generates Firefox (V2) and Edge (V3 no `update_url`) manifests automatically. Only `src/manifest.json` needs to be kept up to date.

When adding a new `web_accessible_resource`, update `src/manifest.json`.

## JavaScript injection order

- **Content scripts** are bundled by esbuild in the order defined by `scripts/build.js > CONTENT_ORDER`. The single `content/bundle.js` is loaded at `document_end`. `contentScript.js` must be first in the bundle (it injects `fullscreen.js`). `iconSets.js` must precede `listenerGlobal.js`.
- **Page context** — only `loadScript("./library/boomiapp/page/fullscreen.js")` at the top of `contentScript.js`, plus an inline `<script>` that sets up `window.BoomiPlatform` from `postMessage` for it.

## Options / configuration

### End-to-end config flow

```
options.html → options.js
    ↓ chrome.storage.sync.set({ key: value })
content/contentScript.js
    ↓ chrome.storage.onChanged → prompts user to reload
    ↓ on load: postMessage(fullscreen keys only) → page/fullscreen.js
content/listenerGlobal.js (in bundle)
    ↓ chrome.storage.sync.get(null) → var BoomiPlatform = config
content/*.js (in bundle)
    ↓ reads BoomiPlatform.someKey from shared IIFE scope
```

### Storage split

- **`chrome.storage.sync`** — user preferences from the options page (feature toggles, refresh interval, shortcut keys, filter choices). Read directly by `listenerGlobal.js` and cached in bundle-scope `BoomiPlatform`.
- **`chrome.storage.local`** — transient UI state: `bph_custom_refresh_active` for refresh persistence, `bph_suppress_reload_dialog` for suppressing the reload prompt from popup changes, `bph_deployment_notes_temp` for holding captured package notes until the deployment notes field appears.
- **`localStorage`** — version-tracking key (`bph_update_notification_version`) used by `content/updateNotification.js` to suppress the changelog popup after first view. Legacy keys (`boomiplatenhanUpdateNot{version}`) from the old approach are auto-cleaned on first run.

## Key libraries / third-party code

- **jQuery 4.0** — actively used for DOM manipulation. Loaded via content_scripts at `document_start` for the isolated context.
- **CodeMirror** — the custom code editor used in Message, Notify, and Database Operation shapes (JSON, XML, HTML, SQL modes). Loaded at `document_start` in the isolated context. Editor popout theming is configurable via the `codemirror_theme` option (read through `getCodeMirrorEditorTheme()` in `global.js`); theme CSS files live in `library/css/cm/theme/` and are registered in `manifest.json`'s `content_scripts[].css` array. The `auto` default mirrors Boomi's light/dark mode (`default`/`twilight`).
- **arrive.js** — mutation-observer library for DOM insertion detection (`document.arrive()`). Only available in the isolated context.
- **rasterizeHTML.min.js** — loaded at `document_start` in the isolated context (used by `imageCapture.js` for process flow → PNG capture)

### arrive.js cleanup pattern

Scripts that use `document.arrive()` on a selector that can be matched multiple times should call `document.unbindArrive(selector)` after the first match to avoid duplicate handlers. Example from `content/menuOpen.js`:
```js
document.arrive(".qm-c-servicenav", function (nav) {
  // ... handler ...
  document.unbindArrive(".qm-c-servicenav");
});
```

## Script responsibilities (partial, high-signal only)

| Script | Context | What it does |
|---|---|---|
| `content/contentScript.js` | content | Entry point. Detects page load via title change, injects `fullscreen.js`, injects masthead options gear icon, sets up platform status check, update notification dialog |
| `content/global.js` | content | Utility functions: URL parsing, `dashboardDays()` (configurable dashboard time-range auto-selector), alert dialog helper, `getCodeMirrorEditorTheme()` (resolves the configured editor popout theme) |
| `content/pageInit.js` | content | Page-load detection, triggers navigation change and update notification checks |
| `content/favicon.js` | content | Page-specific favicons with distinct colors per page, unique page titles, navigation state listeners |
| `content/keyboardShortcuts.js` | content | Ctrl+Alt+S (save) |
| `content/updateNotification.js` | content | Per-version update changelog dialog — reads changelog from bundle-embedded `UPDATE_CHANGELOG_HTML` (generated from `updateNotification.md` at build time). Uses single localStorage key `bph_update_notification_version` with legacy key cleanup. |
| `content/shapePalette.js` | content | Restores old-style build shape connector palette |
| `content/messageEditor.js` | content | CodeMirror-based editor for Message/Notify/Command shapes |
| `content/scheduleIcons.js` | content | Restore old play/pause icons in deployed processes |
| `content/buildFilters.js` | content | Default process filters (reads filter prefs from `chrome.storage`) |
| `content/headerActions.js` | content | Copy component ID/URL, update overlay close, show Close after Lock & Edit |
| `content/reminders.js` | content | Post-deployment schedule reminder |
| `content/filterButtons.js` | content | Collapse-all-folders buttons, single-click tree navigation |
| `content/shapePopup.js` | content | Double-click quick-shape popup on process panel |
| `content/menuOpen.js` | content | Open-in-new-tab icon on dropdown menu items (old and new Boomi UI with shadow DOM) |
| `content/copyDocument.js` | content | Defines `createCopyButton()` shared factory. Clipboard-copy button in Document Viewer dialog. |
| `content/copyXml.js` | content | Clipboard-copy button in Component XML popup — decodes HTML-encoded XML and writes clean XML to clipboard. Uses shared `createCopyButton()` factory. |
| `content/downloadRename.js` | content | Intercepts document downloads, detects file type from content, sends context to background for auto-rename. Binary detection prevents misidentification of ZIP files as CSV/TXT. |
| `content/documentViewer.js` | content | DB document table viewer — "See table" toggle switch renders a sortable, searchable, paginated table from DBSTART| format. Maximize/restore button for the dialog. Shares raw content with copy/download scripts. |
| `content/iconSets.js` | content | Icon set data objects referenced by `listenerGlobal` |
| `content/listenerGlobal.js` | content | Reads config from `chrome.storage.sync`, caches in bundle scope, orchestrates feature listeners via MutationObserver + poller. Also handles shape icon styling injection. |
| `content/canvas.js` | content | Canvas grid toggle (reads `BoomiPlatform.canvas_grid`) |
| `content/customRefresh.js` | content | Custom process-reporting refresh interval — injects "Refresh Every XXs" button with live countdown, pulse animation, last-refreshed tooltip, and persisted state across navigation |
| `content/processDuration.js` | content | Live elapsed-time counter for "In Process" executions on the Process Reporting page — red accent row, gradient badge cell, per-second bounce animation. Resets to `0:00` when auto-refresh stops. |
| `content/shapes.js` | content | Trace path highlight during test execution |
| `content/endpointGlow.js` | content | Non-connected endpoint glow and quick-add Stop shape |
| `content/tableWrap.js` | content | Table text-wrap toggles |
| `content/modalButtons.js` | content | Reverse modal OK/Cancel button order |
| `content/imageCapture.js` | content | Capture process flow to PNG |
| `content/connectionOperations.js` | content | Adjust connection operation screen sizing |
| `content/versionNotification.js` | content | Close button on sticky revision notification |
| `content/sqlEditor.js` | content | CodeMirror SQL editor for Database Operation shapes |
| `content/nativeEditorResize.js` | content | Adds a bottom-right corner drag-resize handle to Boomi's native inline script editor dialog (`#popup_on_popup_content_InlineScriptEditorPanel`, ACE-based). Pointer-capture drag sets the `.flex_panel` size with inline `!important` and dispatches a window resize event so ACE re-measures. |
| `content/brandLogo.js` | content | Replaces the Boomi masthead brand logo with a custom image (reads BoomiPlatform config) |
| `content/boomiGpt.js` | content | Revision History checkbox selection for Boomi GPT compare prompts. Check 2 revisions → builds a "compare {id} version X and Y" prompt, updates the GPT link, and auto-submits on the BoomiAI page. |
| `content/viewInReporting.js` | content | Adds "View in Process Reporting" menu item to deployed process context menus and a quick-link icon on the build page. Opens Process Reporting in a new tab and auto-applies a process name filter via polling state machine. |
| `content/deploymentNotes.js` | content | Captures the package notes textarea (`formrow-package-notes-for-all`) when "Create Packaged Component" is clicked, stores it in `chrome.storage.local`, and fills it into the deployment notes textarea (`formrow-deployment-notes`) when it appears, then clears the temp store. Reads `deployment_notes_auto_apply` from BoomiPlatform config. |
| `content/logHighlight.js` | content | Highlights WARNING-level rows yellow in the Show Log dialog (`#popup_on_popup_content_LogDialogContents`). A 1s poller re-applies the `bph-log-warning` class, detecting the Level column from the header and matching the Level cell exactly, so it survives lazy-load and Previous/Next paging. Reads `log_highlight_warnings` from BoomiPlatform config. |
| `content/logDefaultStatus.js` | content | Sets the default "Minimum Status to Show" filter (`.filterContainer select.gwt-ListBox`) in the Show Log dialog when it opens. A 1s poller applies the configured value once per dialog instance (guarded by the `bph-log-status-applied` class) and dispatches a `change` event so GWT reloads the log, then leaves the dropdown for manual changes. Reads `log_default_min_status` from BoomiPlatform config. |
| `content/setPropertiesExtractor.js` | content | Build toolbar button that extracts all Set Properties shape configurations (property names and parameter values) from the canvas into a modal table with TSV export |
| `content/copySetProperty.js` | content | Adds a Copy Property icon to the Set Properties step panel's property action row. Select a property, click Copy, and choose to copy the property name (e.g. `DDP_ONE`) or its value(s) from a small popup menu. Static values are copied as the raw literal; other source types fall back to the displayed descriptor. |
| `content/svgAssets.js` | content | Shared SVG icon strings used across multiple content scripts |
| `content/modalHelper.js` | content | Shared Boomi-style modal dialog renderer and cleanup utilities |
| `content/toastHelper.js` | content | Shared toast notification utility used across content scripts and the options page |
| `content/defaultScriptingLanguage.js` | content | Auto-selects default scripting language for Data Process, Custom Scripting, and Business Rules shapes — reads `default_scripting_language` from BoomiPlatform config |
| `page/fullscreen.js` | page | Full-screen toggle via keyboard shortcut (page context required) |
| `options.js` | (options page) | Options page save/restore logic |
| `background.js` | background | MV3 service worker: handles download renaming and options-page-open message |

## Versioning

BoomiXcel uses a four-part version in `package.json` — `MAJOR.MINOR.SUBMINOR.BUILD` (currently `2.2.0.0`). The build injects this into all generated manifests.

- **MAJOR** — significant changes: new product direction, rebrands, or breaking architecture/tech-stack shifts. (e.g. `1.x.x.x` → `2.x.x.x` for the "BoomiXcel" rebrand and the esbuild bundling overhaul.)
- **MINOR** — new features or enhancements within the current major (e.g. adding a new content-script feature).
- **SUBMINOR** — small tweaks and bug fixes (e.g. fixing the Document Viewer table race condition).
- **BUILD / revision** — build bumps and hotfixes: rebuilds with no behavior change, build-setting or dependency tweaks, or an urgent patch.

Bump the appropriate segment in `package.json` before running `npm run build` / `npm run release`, and reset all lower segments to `0` when bumping a higher one (e.g. `2.0.3.2` → `2.1.0.0` for a new minor release).

## Browser store builds

`npm run build` does everything:

1. Bundles content scripts into `content/bundle.js`
2. Reads `src/manifest.json` as the **base manifest** (Chrome V3)
3. Generates browser-specific manifests from it:
   - **Chrome** — copied as-is (V3, includes `update_url`)
   - **Firefox** — downgraded to V2, `web_accessible_resources` flattened to string array, `update_url` removed, and `browser_specific_settings.gecko` injected (a stable add-on `id` plus `data_collection_permissions: { required: ["none"] }`, which AMO requires for new submissions from 2025-11-03 — BoomiXcel collects no user data)
   - **Edge** — same as Chrome but without `update_url`
4. Packages each into `build/boomi-xcel-{version}-{Browser}.zip`

The **version** is read from `package.json` and injected into all manifests. To release:
1. Bump `version` in `package.json`
2. Edit `updateNotification.md` with the latest changes
3. Run `npm run build`
4. Upload the zips from `build/` to the respective stores

## Deprecated / archived code

`.oldScriptsKeep/` contains scripts no longer in active rotation, including:
- `copyComponentid.js`, `customprocessButtons.js`, `dbsqlEditor.js`, `home.js`, `initPage.js`, `jsonView.js`, `sqlView.js` — older versions of features now integrated elsewhere

Do not modify or re-integrate without understanding why they were removed.

## Refactoring rules — preserve existing logic

When splitting, renaming, or moving code between files:
- **Copy-paste verbatim** — never rewrite or simplify complex logic during a refactor. Even if the code looks verbose or outdated, its behavior depends on subtle details (DOM event timing, CSS class interactions, dispatched mouse events, etc.) that are easy to break.
- **Verify before committing** — after any file split or rename, test the affected features on `platform.boomi.com` to confirm they still work.
- **When in doubt, don't refactor** — a slightly messy but working file is better than a clean but broken one.

## Documentation — keep it in sync

**Documentation updates are mandatory for every code change.** Any change that adds, removes, or modifies a feature, option, script, or library **must** include corresponding documentation updates. Do not defer this to a later step — it is part of the change.

When adding, removing, or renaming a script file:
- Update the **Script responsibilities** table (this file) and **CONTENT_ORDER** in `scripts/build.js`
- Update the **README.md** Script Reference table and Features list
- Run `npm run build` to verify nothing is broken

When adding or removing a feature (even without script changes):
- Update the **README.md** Features section
- Update the **USER_GUIDE.md** with a description of what the feature does and how users interact with it
- If the feature has a toggle, add it to `TOGGLE_LIST` in `src/popup/popup.js`

When adding or removing a third-party library:
- Update the **Key libraries** section (this file)
- Update the **README.md** Built With section
- If the library changes execution-context rules, update the architecture table in README.md

When documentation sections are added or removed:
- Update the **README.md** table of contents (Contents list)
- If the new section replaces or overlaps with existing content, remove the stale content to avoid duplication

When browser support changes:
- Update the **README.md** Supported Browsers table
- Update the **USER_GUIDE.md** Installation section if store links change

After every change:
- Re-read the files you edited and look for any stale or contradictory information they may now contain — fix it proactively
- If an old library, tool, or approach is no longer in use, remove all references to it from all `.md` files

When modifying the build script (`scripts/build.js`):
- **All regex operations must handle both `\n` and `\r\n` line endings** — always normalize input with `.replace(/\r\n/g, "\n")` before any regex-based text processing, or use `\r?\n` in patterns. The build must produce identical output on Windows, macOS, and Linux.
- **Test on Windows before merging** — PowerShell execution policy may block `npm`. Use `cmd /c "npm run build"` as a fallback.
- If you change manifest structure (add/remove keys), update all three browser generators (Chrome, Firefox, Edge) in `scripts/build.js` to handle the new keys correctly.
- If you change zip naming or output paths, update the corresponding documentation in README.md and AGENTS.md.

## Code style — human-readable formatting

**Variable names — use descriptive names, not shorthand:**
- Variable names must clearly describe what they hold. Avoid single-letter or heavily abbreviated names (`el`, `e`, `cb`, `k`, `v`, `t`, `n`, `o`, `arr`, `obj`, `str`, `num`).
- Acceptable exceptions: loop index `i` (and `j`/`k` for nested loops), `key`/`value` in object iteration, `err` for caught errors.
- Function parameters in callbacks must use meaningful names — e.g., `function (selector)` not `function (el)`, `function (element)` not `function (e)`.
- This rule applies to all code: hand-written, AI-generated, content scripts, options page, popup, and page-context scripts.

**Variable declarations across files:**
- Top-level declarations that are referenced by OTHER files in the bundle **must** use `var`. This is the contract that makes cross-file references work inside the esbuild IIFE. Examples: `var BoomiPlatform`, `var getUrlpath`, `var renderBoomiModal`, `var showToast`, all SVG icon variables.
- Top-level declarations used only within their own file **should** use `const` or `let` for clarity, but `var` is acceptable if the file already uses it consistently.
- Never use implicit globals (assignment without `var`/`let`/`const`). In non-strict mode these become `window` properties and will break if strict mode is ever enabled.

All code must be written in a human-readable format — this applies equally to hand-written and AI-generated code. Avoid minified, obfuscated, or machine-optimized code in any source files.

The **only** minification happens in the build step (`npm run build`). All `.js`, `.css`, and `.html` files in `src/` must remain unminified and readable.

## CSS convention — `boomi.css` is the single stylesheet

All CSS rules **must** be added to `library/css/boomi.css`. Do **not**:
- Set inline `style=""` attributes on elements in HTML
- Set `element.style.*` or `element.style.cssText` in JavaScript
- Add `<style>` blocks to `options.html` or any other HTML file

If JavaScript needs to apply a style, add or remove a **class** (`element.classList.add` / `remove`) and define the style for that class in `boomi.css`. This keeps all visual rules in one auditable place and avoids CSP issues with inline styles in content scripts.

**Exception:** Computed or dynamic styles (e.g., `element.style.top` for drag positioning, `element.style.transform` for image capture scaling, `element.style.width` for palette resizing) are acceptable when the value cannot be known at CSS authoring time. Prefer classes whenever the value is static — for example, a button's base appearance should be a class, but its calculated pixel position on drag is fine as an inline style.

**Modal dialogs** — all Boomi-style modal/notification dialogs must use `renderBoomiModal()` from `content/modalHelper.js`. Do not write inline modal HTML. See the JSDoc in `modalHelper.js` for parameter documentation.

**Toast notifications** — use `showToast(message, duration, type)` from `content/toastHelper.js` for transient notifications. Available in content scripts (via bundle) and the options page (via direct `<script>` tag). Do not write inline toast HTML or use `alert()`.

## No linter / formatter / test suite

There is no linter, formatter, or test suite. To test, load the extension unpacked in `chrome://extensions` (Developer Mode) pointing to the `src/` directory, then visit `https://platform.boomi.com/`.

esbuild warnings (e.g. duplicate object keys) are non-fatal — the build will still complete and produce zips. Do not block on warnings.

On Windows, PowerShell execution policy may block `npm`. Use `cmd /c "npm run build"` as a fallback.

## Options page form contract

Every form control on `options.html` **must** have both:
- `class="option"` — this is how `options.js` discovers controls to serialize/restore via `document.querySelectorAll(".option")`
- a `name` attribute — becomes the `chrome.storage.sync` key

The options page uses a **two-pane layout**: a left sidebar (`.options-nav` of `.options-nav-item` buttons, one per category) and a right content area of `<section class="options-pane" data-pane="…">` panels (only the active one is shown). Each setting is wrapped in an `.option-item` (label + control + its `<small class="helper">`). When adding a control, place it inside an `.option-item` within the appropriate `.options-pane`, and add a matching `<button class="options-nav-item" data-pane="…">` only if you are creating a new category. All controls **must stay in the DOM** — tabs and the search filter only show/hide elements, so `querySelectorAll(".option")` still finds everything for serialize/restore and the per-category "changed" badge counts.

If you add a new option toggle on the options page, you must also add the corresponding key read in `listenerGlobal.js` for it to take effect on the Boomi platform pages.

If the new option is a simple on/off toggle, add it to `TOGGLE_LIST` in `src/popup/popup.js` so it appears in the quick-settings popup.

The options.html logo uses an `<img src="logo/XcelLogo.png">` tag — `*.png` is covered by `web_accessible_resources`.

## Options page styling

All options page CSS **must** be added to `library/css/boomi.css` under the `/* Options page */` section. Do **not** add inline `<style>` blocks or `style=""` attributes to `options.html`, and do **not** set element styles in `options.js`. If the options page needs a new visual rule, it goes in `boomi.css`.

The options page loads `boomi.css` in its `<head>`.

When adding new option controls, prefer the existing patterns:

- **Wrapper** — wrap each setting (label + control + helper) in an `.option-item` inside the relevant `.options-pane`. This standardizes spacing and lets the search filter show/hide whole settings.
- **Toggle switches** — use `<div class="toggle-row"><label class="toggle-label-row">...<label class="toggle"><input type="checkbox" class="option toggle-input" data-default="on"><span class="slider"></span></label>`. The `options.js` serializes `.toggle-input` checkboxes as `"on"`/`"off"` strings.
- **Selects / inputs** — use a `.form-select` or `.form-control` with a `data-default` attribute for reset support.
- **Helper text** — use `<small class="helper">` for option descriptions.

## Rebuild scope

- Changes to `src/library/boomiapp/content/*.js` → must run `npm run build` (they go into the bundle)
- Changes to `src/library/boomiapp/page/fullscreen.js` → no rebuild needed (loaded directly via `loadScript()`)
- Changes to `options.html` or `options.js` → no rebuild needed (loaded standalone by the options page)
- Changes to `src/manifest.json` → must run `npm run build` (generates browser-specific manifests)

To see content-script console output, inspect the page — content scripts log to the main page console in Chrome. To see page-context console output, same approach. Errors from the bundle will show with the source file name in the stack trace (esbuild injects `// src/library/boomiapp/content/...` comments).

## Before committing — mandatory doc verification

After `npm run build` succeeds and **before any git commit**:

1. Read every `.md` file that references the changed feature (grep for script filenames, feature names, option keys)
2. Update any stale or outdated references
3. Verify REFACTOR.md, README.md, USER_GUIDE.md, and AGENTS.md are all current
4. **Do not commit until this is done.** This is a hard stop — the same way `npm run build` is a hard stop before testing.

## No auto-push after build

Running `npm run build` produces artifacts (`bundle.js`, manifests, zips) and bumps version references. These build outputs must be reviewed before pushing. **Do not auto-push after a build.** Always commit explicitly with a reviewed diff, then push on demand.
