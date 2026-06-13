# AGENTS.md

## Project summary

Boomi Platform Enhancer — a browser extension (Chrome + Firefox) that injects JS/CSS into `https://platform.boomi.com/*` to enhance the Boomi integration platform's web UI.

## Build step

```bash
npm install          # install esbuild
npm run build        # bundle content scripts → content/bundle.js + browser zips
npm run watch        # rebuild on file changes
```

Content scripts in `src/library/boomiapp/content/` are bundled by esbuild into a single `src/library/boomiapp/content/bundle.js`, which is the only content-script entry in every manifest. The bundle order is defined in `scripts/build.js > CONTENT_ORDER`. If you add a new content script, add it to that array and run `npm run build`.

`bundle.js` is a build artifact — it's gitignored. The only page-context script is `page/fullscreen.js` (Fullscreen API requires page context); it is loaded individually via `loadScript()`.

### Bundle scope behavior

esbuild wraps the bundle in an IIFE (`(() => { ... })()`). Functions and `var` declarations are scoped to that IIFE — they are shared between all content scripts inside the bundle but are **not** on `window`. This is how `global.js` functions (`getUrlpath()`, `dashboardDays()`, `getUrlParameter()`, `getGWTPageName()`, `showInformationAlertDialog()`) are callable from `boomi.js`, `dashboard.js`, and other content scripts.

The `listenerGlobal.js` sets a `var BoomiPlatform = {}` in the bundle scope, reads config from `chrome.storage.sync.get()`, and all other scripts reference `BoomiPlatform.key` from this shared IIFE-scoped variable.

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
- **`chrome.storage.local`** — `headerVisible` state (show/hide toggle). Separate from sync because it's transient UI state, not a preference.
- **`localStorage`** — version-tracking key (`boomiplatenhanUpdateNot{version}`) used by `content/updateNotification.js` to suppress the changelog popup after first view.

## Key libraries / third-party code

- **jQuery 3.7.1** — actively used for DOM manipulation. Loaded via content_scripts at `document_start` for the isolated context. The old `jquery-3.6.min.js` file is preserved in the repo for reference but not loaded.
- **CodeMirror** — the custom code editor used in Message/Notify shapes (loaded at `document_start` in the isolated context)
- **arrive.js** — mutation-observer library for DOM insertion detection (`document.arrive()`). Only available in the isolated context.
- **shortcut.js** — keyboard shortcut library (bundled into `content/bundle.js`)
- **showdown.min.js**, **rasterizeHTML.min.js** — loaded at `document_start` in the isolated context (used by content scripts for markdown rendering and image capture)

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
| `content/contentScript.js` | content | Entry point. Detects page load via title change, injects `fullscreen.js`, sets up platform status check, update notification dialog |
| `content/global.js` | content | Utility functions: URL parsing, dashboard 7-day default, alert dialog helper |
| `content/boomi.js` | content | Core Boomi platform enhancements: header show/hide, copy component ID, capture flow button, and many DOM modifications |
| `content/dashboard.js` | content | Dashboard-specific enhancements |
| `content/shortCuts.js` | content | Ctrl+Alt+S (save), Ctrl+Alt+T (test) |
| `content/updateNotification.js` | content | Per-version update changelog dialog (uses `localStorage` to suppress after first view) |
| `content/buildPallet.js` | content | Restores old-style build shape connector palette |
| `content/messageEditor.js` | content | CodeMirror-based editor for Message/Notify/Command shapes |
| `content/scheduleIcons.js` | content | Restore old play/pause icons in deployed processes |
| `content/buildFilters.js` | content | Default process filters (reads filter prefs from `chrome.storage`) |
| `content/headerActions.js` | content | Header show/hide toggle, copy component ID/URL, update overlay close |
| `content/reminders.js` | content | Post-deployment schedule reminder |
| `content/filterButtons.js` | content | Collapse-all-folders buttons, single-click tree navigation |
| `content/quickclickComponent.js` | content | Double-click quick-shape popup on process panel |
| `content/menuOpen.js` | content | Open-in-new-tab icon on dropdown menu items (old and new Boomi UI with shadow DOM) |
| `content/copyDocument.js` | content | Clipboard-copy button in Document Viewer dialog |
| `content/downloadRename.js` | content | Intercepts document downloads, sends context to background for auto-rename |
| `content/iconSets.js` | content | Icon set data objects referenced by `listenerGlobal` |
| `content/listenerGlobal.js` | content | Reads config from `chrome.storage.sync`, caches in bundle scope, orchestrates feature listeners via MutationObserver + poller |
| `content/canvas.js` | content | Canvas grid toggle (reads `BoomiPlatform.canvas_grid`) |
| `content/customRefresh.js` | content | Custom process-reporting refresh interval |
| `content/shapes.js` | content | Non-connected endpoint glow, trace path highlight |
| `content/descriptionMarkdown.js` | content | Markdown rendering in process descriptions |
| `content/tableWrap.js` | content | Table text-wrap toggles |
| `content/modalButtons.js` | content | Reverse modal OK/Cancel button order |
| `content/notes.js` | content | Markdown in process note elements |
| `content/imageCapture.js` | content | Capture process flow to PNG |
| `content/groups.js` | content | Note group overlays on process canvas |
| `content/connectionOperations.js` | content | Adjust connection operation screen sizing |
| `content/versionNotification.js` | content | Close button on sticky revision notification |
| `content/dbsqlEditor.js` | content | Enables flex panel resizing for the inline SQL editor |
| `content/brandLogo.js` | content | Replaces the Boomi masthead brand logo with a custom image |
| `page/fullscreen.js` | page | Full-screen toggle via keyboard shortcut (page context required) |
| `options.js` | (options page) | Options page save/restore logic |
| `background.js` | background | MV3 service worker: handles download renaming and options-page-open message |

## Browser store builds

`npm run build` does everything:

1. Bundles content scripts into `content/bundle.js`
2. Reads `src/manifest.json` as the **base manifest** (Chrome V3)
3. Generates browser-specific manifests from it:
   - **Chrome** — copied as-is (V3, includes `update_url`)
   - **Firefox** — downgraded to V2, `web_accessible_resources` flattened to string array, `update_url` removed
   - **Edge** — same as Chrome but without `update_url`
4. Packages each into `build/boomi-platform-enhancer-{version}-{Browser}.zip`

The **version** is read from `package.json` and injected into all manifests. To release:
1. Bump `version` in `package.json`
2. Run `npm run build`
3. Upload the zips from `build/` to the respective stores

## Deprecated / archived code

`.Old Scripts but want to keep/` contains scripts no longer in active rotation, including:
- `copyComponentid.js`, `customprocessButtons.js`, `home.js`, `initPage.js`, `jsonView.js`, `sqlView.js` — older versions of features now integrated elsewhere

Do not modify or re-integrate without understanding why they were removed.

## Code style — human-readable formatting

All code must be written in a human-readable format — this applies equally to hand-written and AI-generated code. Avoid minified, obfuscated, or machine-optimized code in any source files.

The **only** minification happens in the build step (`npm run build`). All `.js`, `.css`, and `.html` files in `src/` must remain unminified and readable.

## CSS convention — `boomi.css` is the single stylesheet

All CSS rules **must** be added to `library/css/boomi.css`. Do **not**:
- Set inline `style=""` attributes on elements in HTML
- Set `element.style.*` or `element.style.cssText` in JavaScript
- Add `<style>` blocks to `options.html` or any other HTML file

If JavaScript needs to apply a style, add or remove a **class** (`element.classList.add` / `remove`) and define the style for that class in `boomi.css`. This keeps all visual rules in one auditable place and avoids CSP issues with inline styles in content scripts.

## No linter / formatter / test suite

There is no linter, formatter, or test suite. To test, load the extension unpacked in `chrome://extensions` (Developer Mode) pointing to the `src/` directory, then visit `https://platform.boomi.com/`.

esbuild warnings (e.g. duplicate object keys) are non-fatal — the build will still complete and produce zips. Do not block on warnings.

On Windows, PowerShell execution policy may block `npm`. Use `cmd /c "npm run build"` as a fallback.

## Options page form contract

Every form control on `options.html` **must** have both:
- `class="option"` — this is how `options.js` discovers controls to serialize/restore via `document.querySelectorAll(".option")`
- a `name` attribute — becomes the `chrome.storage.sync` key

If you add a new option toggle on the options page, you must also add the corresponding key read in `listenerGlobal.js` for it to take effect on the Boomi platform pages.

The options.html logo uses an `<img src="logo/XcelLogo.png">` tag — `*.png` is covered by `web_accessible_resources`.

## Options page styling

All options page CSS **must** be added to `library/css/boomi.css` under the `/* Options page */` section. Do **not** add inline `<style>` blocks or `style=""` attributes to `options.html`, and do **not** set element styles in `options.js`. If the options page needs a new visual rule, it goes in `boomi.css`.

The options page loads `boomi.css` in its `<head>`.

When adding new option controls, prefer the existing patterns:

- **Toggle switches** — use `<div class="toggle-row"><label class="toggle-label-row">...<input type="checkbox" class="option form-check-input toggle-switch">`. The `options.js` serializes `.toggle-switch` checkboxes as `"on"`/`"off"` strings.
- **Selects / inputs** — use standard `.mb-3` blocks with `.form-select` or `.form-control` and a `data-default` attribute for reset support.
- **Helper text** — use `<small class="helper">` for option descriptions.

## Rebuild scope

- Changes to `src/library/boomiapp/content/*.js` → must run `npm run build` (they go into the bundle)
- Changes to `src/library/boomiapp/page/fullscreen.js` → no rebuild needed (loaded directly via `loadScript()`)
- Changes to `options.html` or `options.js` → no rebuild needed (loaded standalone by the options page)
- Changes to `src/manifest.json` → must run `npm run build` (generates browser-specific manifests)

To see content-script console output, inspect the page — content scripts log to the main page console in Chrome. To see page-context console output, same approach. Errors from the bundle will show with the source file name in the stack trace (esbuild injects `// src/library/boomiapp/content/...` comments).
