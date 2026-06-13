<br />
<p align="center">
  <a href="logo/extensionLogo.png">
    <img src="logo/extensionLogo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Boomi Xcel <br> The Boomi Integration Platform Extension!</h3>
  <h6 align="center">A New Name for a New Age</h6>

  <p align="center">
    A Browser extension that enhances the Boomi Platform web UI
    <br />
    <br />
    <a href="https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko">Chrome Store</a>
    ·
    <a href="https://addons.mozilla.org/en-US/firefox/addon/boomi-platform-enhancer-active">Firefox Add-ons</a>
    ·
    <a href="https://github.com/matt-flaig/Boomi-Platform-Extension/issues">Request a Feature</a>
  </p>
</p>

<h2 align="center"><b>Disclaimer</b></h2>
<p align="center">Boomi has no affiliation with this extension and does not support it, endorse its use, or provide any promises or warranties.</p>

---

## Features

**Keyboard Shortcuts**
- `Ctrl+Alt+S` — Save the current flow
- `Ctrl+Alt+T` — Test the current flow
- Configurable shortcut for full-screen toggle (default: `~`)

**Build Canvas**
- Capture the entire process flow as a PNG (with transparency, zoom, and note-expansion options)
- Remove the canvas dot grid (works well with dark mode)
- Double-click to add shapes via a quick-shape popup
- Restored old-style shape connector palette
- Non-connected endpoints glow for visibility; hover an endpoint to quick-add a Stop shape
- Trace path highlighting during test execution
- Note group overlays — colored semi-transparent bounding boxes created from process notes

**Editing**
- CodeMirror editor for Message, Notify, and Command shapes (JSON, XML, HTML, SQL modes)
- Markdown rendering in process descriptions and notes
- Resizable SQL editor in Database Operation shapes

**Navigation & Layout**
- Hide the header to reclaim build space
- Collapse-all-folders button in Process Reporting and Deployed Process screens
- Single-click anywhere on a process folder/title to expand (instead of the tiny icon)
- Open dropdown menu items in a new tab
- Reverse modal button order (OK/Cancel instead of Cancel/OK)
- Remove sticky revision notification from the build view
- Adjust connection operation screen sizing

**Process Reporting**
- Custom auto-refresh interval
- Table text wrapping (always / never / toggle on header hover)
- Auto-updating pending executions clock
- Default dashboard view set to 7 days

**Other**
- Icon set selection for shapes (Legacy, Modern, Minimal, etc.)
- Old-style play/pause icons in deployed processes
- Copy component ID/URL from the build canvas
- Post-deployment schedule reminder
- Platform status check on every page
- Tab names simplified (account name removed, configurable)
- Page-specific favicons for each Boomi subdomain (AtomSphere, MdmSphere, ApiSphere, Flow)
- Auto-check default build filters (Process, Process Property, Cross Reference Table, API Service)
- Per-version changelog popup shown once after each update
- Settings-changed notification prompting a page reload

---

## Screenshots

![](WebStore%20images/Image1.png)
![](WebStore%20images/Image2.png)
![](WebStore%20images/Image3.png)
![](WebStore%20images/Image4.png)

---

## Installing

Visit one of the browser stores:

- [Chrome Web Store](https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/boomi-platform-enhancer-active)

Click **Install** — the extension auto-enables on `https://platform.boomi.com/*`.

---

## Development

### Setup

```bash
npm install
```

### Load the extension

1. Open `chrome://extensions` (or `about:debugging` in Firefox)
2. Enable **Developer Mode**
3. Click **Load unpacked** and select the `src/` directory
4. Visit `https://platform.boomi.com/`

### Build

```bash
npm run build        # bundle content scripts, generate browser manifests, create zips
npm run watch        # rebuild content scripts on file changes
```

> On Windows, PowerShell execution policy may block `npm`. Use `cmd /c "npm run build"` as a fallback. esbuild warnings (e.g. duplicate object keys) are non-fatal — the build still completes and produces zips.

**When to rebuild:** only changes to `src/library/boomiapp/content/*.js` and `src/manifest.json` require a rebuild. Editing `options.html`, `options.js`, or `page/fullscreen.js` does not.

`npm run build` produces three upload-ready zips in `build/`:

| File | Manifest | Notes |
|------|----------|-------|
| `boomi-platform-enhancer-X.Y.Z-Chrome.zip` | V3 | includes `update_url` |
| `boomi-platform-enhancer-X.Y.Z-Firefox.zip` | V2 | flat `web_accessible_resources` |
| `boomi-platform-enhancer-X.Y.Z-Edge.zip` | V3 | no `update_url` |

All manifests are generated from `src/manifest.json` — the single source of truth.

### Project Structure

```
src/
  manifest.json              ← Chrome V3 base manifest
  library/
    boomiapp/
      content/               ← content-script context (bundled → bundle.js)
      page/                  ← page context (individually injected)
      options.js             ← options page logic
    css/                     ← injected stylesheets
    inject/                  ← third-party libs (CodeMirror, arrive.js, etc.)
    jquery/                  ← jQuery 3.7.1
scripts/
  build.js                   ← esbuild bundler + manifest generator + zipper
build/                       ← release zips (output)
```



### Architecture

The extension runs scripts in two separate contexts:

**Content-context (`content/`)** — runs in the extension's isolated sandbox. Scripts here are bundled by esbuild into a single `bundle.js` (order defined by `CONTENT_ORDER` in `scripts/build.js`). They have access to `chrome.*` APIs, `document.arrive()`, and `CodeMirror`. Config is read directly from `chrome.storage.sync` and cached in a shared `BoomiPlatform` variable within the bundle's IIFE scope. **All feature scripts live here.**

**Page-context (`page/`)** — only `fullscreen.js`, because Chrome restricts the Fullscreen API from the isolated world. It is injected via `<script>` tag by `contentScript.js` and receives config through a minimal `postMessage`.

**Rule of thumb:**
| If the script... | Place it in... |
|---|---|
| Uses `chrome.*`, `document.arrive()`, `CodeMirror`, or `shortcut.add()` | `content/` |
| Needs Fullscreen API (`element.requestFullscreen`) | `page/` |

### Configuration flow

```text
options.html → options.js
    ↓ chrome.storage.sync.set()
content/listenerGlobal.js
    ↓ chrome.storage.sync.get(null) → var BoomiPlatform = config
content/*.js
    ↓ reads BoomiPlatform.someKey from shared bundle scope
content/contentScript.js
    ↓ postMessage(fullscreen keys only) → page/fullscreen.js
```

Three storage backends are used:
- **`chrome.storage.sync`** — user preferences (feature toggles, refresh interval, shortcuts). Read directly by `listenerGlobal.js` and cached.
- **`chrome.storage.local`** — transient UI state (header visibility toggle)
- **`localStorage`** — per-version changelog suppression (`boomiplatenhanUpdateNot{version}`)

### Conventions

- **Human-readable source code** — all `.js`, `.css`, and `.html` files in `src/` must be written in a human-readable format, whether hand-written or AI-generated. Use descriptive names, consistent indentation, and clear structure. Minification happens only at build time via esbuild — never commit minified or obfuscated source code.
- **Options page form contract** — every form control on `options.html` must have both `class="option"` and a `name` attribute. `options.js` discovers controls via `.option` and uses `name` as the `chrome.storage.sync` key. New toggles also need a corresponding key read in `listenerGlobal.js`.
- **arrive.js cleanup** — scripts using `document.arrive()` on a reusable selector should call `document.unbindArrive(selector)` after the first match to prevent duplicate handlers
- **jQuery** — use 3.7.1. Loaded at `document_start` in the isolated context
- **No build output committed** — `content/bundle.js` and `node_modules/` are gitignored

### Debugging

Load the extension unpacked from `src/` in `chrome://extensions` (Developer Mode). Both content-script and page-context output appear in the main page console when inspecting `https://platform.boomi.com/`. Bundle stack traces include the original source filename (esbuild injects `// src/library/boomiapp/content/...` comments).

### Script reference

| Script | Context | Purpose |
|---|---|---|
| `content/contentScript.js` | content | Entry point — injects fullscreen.js, checks platform status |
| `content/global.js` | content | Shared utilities — URL parsing, dashboard default, alert dialogs |
| `content/boomi.js` | content | Core enhancements — header toggle, copy component ID, capture flow |
| `content/shortCuts.js` | content | Keyboard shortcuts — Ctrl+Alt+S save, Ctrl+Alt+T test |
| `content/messageEditor.js` | content | CodeMirror editor for Message/Notify/Command shapes |
| `content/buildPallet.js` | content | Restored old-style shape connector palette |
| `content/scheduleIcons.js` | content | Old play/pause icons in deployed processes |
| `content/buildFilters.js` | content | Default process filters |
| `content/filterButtons.js` | content | Collapse-all-folders, single-click tree navigation |
| `content/quickclickComponent.js` | content | Double-click quick-shape popup |
| `content/menuOpen.js` | content | Open-in-new-tab icon on dropdown menus |
| `content/reminders.js` | content | Post-deployment schedule reminder |
| `content/clickComponents.js` | content | Header show/hide toggle |
| `content/updateNotification.js` | content | Per-version changelog popup |
| `content/iconSets.js` | content | Icon set data for shape styling |
| `content/listenerGlobal.js` | content | Reads config from storage, caches it, runs the DOM poller |
| `content/canvas.js` | content | Canvas grid toggle |
| `content/customRefresh.js` | content | Custom process-reporting refresh interval |
| `content/shapes.js` | content | Endpoint glow, trace path highlighting |
| `content/descriptionMarkdown.js` | content | Markdown in process descriptions |
| `content/tableWrap.js` | content | Table text-wrap toggles |
| `content/modalButtons.js` | content | Reverse modal OK/Cancel order |
| `content/notes.js` | content | Markdown in note elements |
| `content/imageCapture.js` | content | Process flow → PNG capture |
| `content/groups.js` | content | Note group overlays on canvas |
| `content/connectionOperations.js` | content | Connection operation screen sizing |
| `content/versionNotification.js` | content | Close button on revision notification |
| `page/fullscreen.js` | page | Full-screen toggle (page context required) |
| `options.js` | options | Options page save/restore |

`Old Scripts but want to keep/` contains archived scripts (previous versions of features, unused experiments). They are not loaded by any manifest — do not modify or re-integrate them without first understanding why they were removed.

### To release

```bash
# 1. Bump version in package.json
# 2. Build
npm run build
# 3. Upload zips from build/ to each browser store
```

---

### Built With

- **[esbuild](https://esbuild.github.io/)** — content-script bundling
- **[jQuery 3.7](https://jquery.com/)** — DOM manipulation
- **[CodeMirror](https://codemirror.net/)** — code editor for Message/Notify shapes
- **[arrive.js](https://github.com/uzairfarooq/arrive)** — DOM mutation observer
- **[showdown](https://github.com/showdownjs/showdown)** — Markdown rendering
- **[rasterizeHTML.js](https://github.com/cburgmer/rasterizeHTML.js)** — process flow image capture

---

## Contributing

Contributions are welcome. Please [open an issue](https://github.com/matt-flaig/Boomi-Platform-Extension/issues) before starting substantial work to discuss the change.

### Making changes

1. Fork and create a branch from `main` (`git checkout -b feature/your-feature`)
2. See the [Architecture](#architecture) section above for where to place new files:
   - **Content-context** → `src/library/boomiapp/content/`, add to `CONTENT_ORDER` in `scripts/build.js`
   - **Page-context** (Fullscreen API only) → `src/library/boomiapp/page/`, add to `web_accessible_resources` in `src/manifest.json`
3. Verify the extension loads and works on `https://platform.boomi.com/`
4. Run `npm run build` and confirm it finishes without errors
5. Commit with a clear message describing what changed and why
6. Push and open a pull request against the `main` branch

---

## Discussion

Join the [Boomi Discord — #extension-enhancer](https://discord.gg/XcXRrYHVUa) for updates and discussion.

---

## License

Distributed under the MIT License.

## Acknowledgements

- **Tony Banik** — Boomi Tools developer, source of many ideas
- [**Baptiste BIEBER**](https://github.com/baptistebieber) — Boomi Extension developer
- **Noah Skelton** — Build Pallet Fix script
- [**Matthew Flaig**](https://github.com/matt-flaig) — Ongoing contributor and maintainer
- [**Boomi Community**](https://community.boomi.com/)
