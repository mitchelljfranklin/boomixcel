<br />
<p align="center">
  <a href="logo/XcelLogo.png">
    <img src="logo/XcelLogo.png" alt="Logo" height="80">
  </a>

  <h3 align="center">Boomi Xcel <br> The Boomi Integration Platform Extension!</h3>
  <h6 align="center">A New Name for a New Age</h6>

  <p align="center">
    <img src="logo/BoomiXcelSlim50.png" alt="Boomi Xcel" width="65%">
  </p>

  <p align="center">
    <a href="https://github.com/mitchelljfranklin/BoomiXcel/releases">
      <img src="https://img.shields.io/github/package-json/v/mitchelljfranklin/BoomiXcel?color=blue&style=for-the-badge" alt="Version">
    </a>
    <a href="https://github.com/mitchelljfranklin/BoomiXcel/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-GPLv3-blue?style=for-the-badge" alt="License">
    </a>
    <a href="https://github.com/mitchelljfranklin/BoomiXcel">
      <img src="https://img.shields.io/github/stars/mitchelljfranklin/BoomiXcel?color=gold&style=for-the-badge" alt="GitHub stars">
    </a>
    <br />
    <a href="https://github.com/mitchelljfranklin/BoomiXcel/releases">📦 What's new</a>
  </p>

  <p align="center">
    A Browser extension that enhances the Boomi Integration Platform web UI
    <br />
    <br />
    <a href="https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko">
      <img src="https://img.shields.io/badge/Chrome-Install-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
      <img src="https://img.shields.io/chrome-web-store/users/behhfojpggobllhaifocfcampokbfhko?color=4285F4&style=for-the-badge&label=%20" alt="Chrome Web Store users">
    </a>
    &nbsp;&nbsp;
    <a href="https://addons.mozilla.org/en-US/firefox/addon/boomi-platform-enhancer-active">
      <img src="https://img.shields.io/badge/Firefox-Install-FF7139?style=for-the-badge&logo=firefox&logoColor=white" alt="Install from Firefox Add-ons">
      <img src="https://img.shields.io/amo/users/boomi-platform-enhancer-active?color=FF7139&style=for-the-badge&label=%20" alt="Firefox Add-on users">
    </a>
    <br />
    <br />
    <a href="https://github.com/mitchelljfranklin/BoomiXcel/issues">🐛 Request a Feature</a>
  </p>
</p>

> <p align="center">⚠️ <b>DISCLAIMER</b> ⚠️</p>
> <p align="center"><b>Please note that Boomi has no association with this extension and does not sanction its use. They do not offer any guarantees or warranties in relation to its functionality.</b></p>

---

## 📋 Contents

- [Features](#-features)
- [Screenshots](#screenshots)
- [Installing](#-installing)
- [Supported Browsers](#-supported-browsers)
- [Development](#-development)
- [Contributing](#-contributing)
- [Discussion](#-discussion)
- [Contributors](#-contributors)
- [Privacy](#-privacy)
- [Security](#-security)
- [FAQ](#-faq)
- [License](#-license)

---

## ✨ Features

🔧 **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Ctrl + Alt + S` | Save the current flow |
| Configurable (default `~`) | Toggle full-screen mode |

🎨 **Build Canvas**
- Capture the entire process flow as a PNG (with transparency, zoom, and note-expansion options)
- Remove the canvas dot grid — works well with dark mode (configurable)
- Double-click to add shapes via a quick-shape popup
- Restored old-style shape connector palette
- Non-connected endpoints glow for visibility; hover an endpoint to quick-add a Stop shape (configurable)
- Trace path highlighting during test execution (configurable)
- Note group overlays — colored semi-transparent bounding boxes created from process notes
- View in Process Reporting quick-link icon next to the Description link

✏️ **Editing**
- CodeMirror editor for Message, Notify, and Command shapes (JSON, XML, HTML, SQL modes)
- Resizable SQL editor in Database Operation shapes
- Copy raw document content from the Document Viewer dialog

🧭 **Navigation & Layout**
- Hide the header to reclaim build space
- Collapse-all-folders button in Process Reporting and Deployed Process screens
- Single-click anywhere on a process folder/title to expand (instead of the tiny icon)
- Open dropdown menu items in a new tab (old and new Boomi UI)
- Reverse modal button order — OK/Cancel instead of Cancel/OK (configurable)
- Remove sticky revision notification from the build view
- Adjust connection operation screen sizing
- Keep the Boomi footer bar always visible (configurable)

📊 **Process Reporting**
- Custom auto-refresh interval (configurable)
- Table text wrapping — always / never / toggle on header hover (configurable)
- Auto-updating pending executions clock
- Default dashboard view set to 7 days

⭐ **Other**
- Icon set selection for shapes — Legacy, Modern, Minimal, etc. (configurable)
- Old-style play/pause icons in deployed processes (configurable)
- Copy component ID/URL from the build canvas
- Replace the Boomi masthead brand logo with the BoomiXcel logo (configurable)
- Automatically rename downloaded documents to `<ProcessName>_<timestamp>.<ext>`
- Post-deployment schedule reminder (configurable)
- Platform status check on every page
- Tab names simplified — account name removed (configurable)
- Page-specific favicons for each Boomi subdomain (configurable)
- Auto-check default build filters — Process, Process Property, Cross Reference Table, API Service (configurable)
- Per-version changelog popup shown once after each update
- Settings-changed notification prompting a page reload

<p align="right"><sub><a href="#-contents">↑ Back to top</a></sub></p>


## 🚀 Installing

Visit one of the browser stores:

<a href="https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko">
      <img src="https://img.shields.io/badge/Chrome-Install-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
      <img src="https://img.shields.io/chrome-web-store/users/behhfojpggobllhaifocfcampokbfhko?color=4285F4&style=for-the-badge&label=%20" alt="Chrome Web Store users">
</a>
<br>

<a href="https://addons.mozilla.org/en-US/firefox/addon/boomi-platform-enhancer-active">
      <img src="https://img.shields.io/badge/Firefox-Install-FF7139?style=for-the-badge&logo=firefox&logoColor=white" alt="Install from Firefox Add-ons">
      <img src="https://img.shields.io/amo/users/boomi-platform-enhancer-active?color=FF7139&style=for-the-badge&label=%20" alt="Firefox Add-on users">
</a>

Click **Install** — the extension auto-enables on `https://platform.boomi.com/*`.

<p align="right"><sub><a href="#-contents">↑ Back to top</a></sub></p>

---

## 🌐 Supported Browsers

| Browser     | Minimum Version | Manifest | Store Listing                                                                                                          |
| -------------| -----------------| ----------| ------------------------------------------------------------------------------------------------------------------------|
| **Chrome**  | 88+             | V3       | [Chrome Web Store](https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko) |
| **Firefox** | 109+            | V2       | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/boomi-platform-enhancer-active)                       |
| **Edge**    | 88+             | V3       | [Chrome Web Store](https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko) |
| **Brave**   | 1.45+           | V3       | [Chrome Web Store](https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko) |
| **Opera**   | 74+             | V3       | [Chrome Web Store](https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko) |
| **Arc**     | 1.0+            | V3       | [Chrome Web Store](https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko) |

> All Chromium-based browsers (Brave, Opera, Arc, Vivaldi, etc.) can install the extension from the Chrome Web Store.

<p align="right"><sub><a href="#-contents">↑ Back to top</a></sub></p>

---

## 🛠️ Development

### Setup

```bash
npm install          # install dependencies (esbuild, archiver)
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

`npm run build` (via `scripts/build.js`) performs these steps in order:

1. **Content bundle** — reads `CONTENT_ORDER`, concatenates all content scripts into a single source, then runs esbuild to produce a minified IIFE bundle at `src/library/boomiapp/content/bundle.js`. The concatenation approach ensures `var`/`const`/`function` declarations at the top level of each file share the same scope.

2. **Webstore description** — extracts the Features section from the README, converts markdown to plain text, and regenerates `webstore-description.txt`.

3. **Browser manifests** — reads version from `package.json`, injects it into `src/manifest.json`, then generates two additional manifests:
   - **Firefox** — downgraded to Manifest V2, `web_accessible_resources` flattened to string array, `update_url` removed
   - **Edge** — same as Chrome V3 but `update_url` removed

4. **Zip packages** — creates three archives in `build/`:

| File | Manifest | Notes |
|------|----------|-------|
| `boomi-platform-enhancer-X.Y.Z-Chrome.zip` | V3 | includes `update_url` |
| `boomi-platform-enhancer-X.Y.Z-Firefox.zip` | V2 | flat `web_accessible_resources` |
| `boomi-platform-enhancer-X.Y.Z-Edge.zip` | V3 | no `update_url` |

All manifests are generated from `src/manifest.json` — the single source of truth, with version injected from `package.json`.

> On Windows, PowerShell execution policy may block `npm`. Use `cmd /c "npm run build"` as a fallback. esbuild warnings (e.g. duplicate object keys) are non-fatal — the build still completes and produces zips.

**When to rebuild:** only changes to `src/library/boomiapp/content/*.js` and `src/manifest.json` require a rebuild. Editing `options.html`, `options.js`, or `page/fullscreen.js` does not.

### Project Structure

```
src/
├── manifest.json              # Chrome V3 base manifest
├── options.html               # Extension options page
├── background.js              # MV3 service worker
├── library/
│   ├── boomiapp/
│   │   ├── content/           # Content-script context (bundled)
│   │   ├── page/              # Page context (fullscreen.js only)
│   │   └── options.js         # Options page logic
│   ├── css/
│   │   └── boomi.css          # All extension styles (single stylesheet)
│   ├── inject/                # Third-party libraries
│   │   ├── arrive.min.js
│   │   ├── showdown.min.js
│   │   ├── rasterizeHTML.min.js
│   │   └── cm/                # CodeMirror files
│   └── jquery/
│       ├── jquery-4.0.0.min.js
│       └── jquery-3.6.min.js  # Unused, kept for reference
├── logo/                      # Extension icons and brand images
├── icon16.png, icon48.png, icon128.png
scripts/
└── build.js                   # esbuild bundler + manifest generator + zipper
```



### Architecture

The extension runs scripts in two separate contexts:

**Content-context (`content/`)** — runs in the extension's isolated sandbox. Scripts here are bundled by esbuild into a single `bundle.js` (order defined by `CONTENT_ORDER` in `scripts/build.js`). They have access to `chrome.*` APIs, `document.arrive()`, and `CodeMirror`. Config is read directly from `chrome.storage.sync` and cached in a shared `BoomiPlatform` variable within the bundle's IIFE scope. **All feature scripts live here.**

**Page-context (`page/`)** — only `fullscreen.js`, because Chrome restricts the Fullscreen API from the isolated world. It is injected via `<script>` tag by `contentScript.js` and receives config through a minimal `postMessage`.

**Rule of thumb:**
| If the script... | Place it in... |
|---|---|
| Uses `chrome.*`, `document.arrive()`, or `CodeMirror` | `content/` |
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

- **Human-readable source code** — all `.js`, `.css`, and `.html` files in `src/` must be written in a human-readable format, whether hand-written or AI-generated. Minification happens only at build time via esbuild — never commit minified or obfuscated source code.
- **CSS convention** — all styling goes in `library/css/boomi.css`. Never use inline `style=""` attributes, `element.style.*` in JS, or `<style>` blocks. Use classes (`element.classList.add`/`remove`) and define the rules in `boomi.css`. This applies to every file — options page, content scripts, everything.
- **Modal dialogs** — use `renderBoomiModal()` from `content/modalHelper.js` for all Boomi-style notification and dialog modals. Do not write inline modal HTML.
- **Toast notifications** — use `showToast()` from `content/toastHelper.js` for transient notifications. Available everywhere. Do not write inline toast HTML or use `alert()`.
- **Options page form contract** — every form control on `options.html` must have both `class="option"` and a `name` attribute. `options.js` discovers controls via `.option` and uses `name` as the `chrome.storage.sync` key. New toggles also need a corresponding key read in `listenerGlobal.js`. Each control should have a `data-default` attribute for the Reset button. On/off options use toggle switches (`.toggle-switch` checkboxes) serialized as `"on"`/`"off"` strings.
- **Options page CSS** — all options page styling lives in `library/css/boomi.css` under `/* Options page */`. Never add inline `<style>` blocks or `style=""` attributes to `options.html`, and never set element styles in `options.js`. The options page loads `boomi.css` in its `<head>`.
- **arrive.js cleanup** — scripts using `document.arrive()` on a reusable selector should call `document.unbindArrive(selector)` after the first match to prevent duplicate handlers
- **jQuery** — use 4.0. Loaded at `document_start` in the isolated context
- **Keep the README updated** — when adding or removing a feature, update the Features section. When adding, removing, or renaming a script file, update the Script Reference table. When changing the build process, update the Build section. Also update the **USER_GUIDE.md** with a description of new/changed features and how users interact with them.

### Debugging

Load the extension unpacked from `src/` in `chrome://extensions` (Developer Mode). Both content-script and page-context output appear in the main page console when inspecting `https://platform.boomi.com/`. Bundle stack traces include the original source filename (esbuild injects `// src/library/boomiapp/content/...` comments).

### Script reference

<details>
<summary>📂 <b>Click to expand — full script reference (40 files)</b></summary>

| Script | Context | Purpose |
|---|---|---|
| `content/contentScript.js` | content | Entry point — injects fullscreen.js, checks platform status |
| `content/global.js` | content | Shared utilities — URL parsing, dashboard default, alert dialogs |
| `content/pageInit.js` | content | Page-load detection, header visibility, button injection |
| `content/favicon.js` | content | Page-specific favicons, unique page titles, nav listeners |
| `content/dashboard.js` | content | Dashboard-specific enhancements |
| `content/keyboardShortcuts.js` | content | Ctrl+Alt+S save |
| `content/messageEditor.js` | content | CodeMirror editor for Message/Notify/Command shapes |
| `content/shapePalette.js` | content | Restored old-style shape connector palette |
| `content/scheduleIcons.js` | content | Old play/pause icons in deployed processes |
| `content/buildFilters.js` | content | Default process filters |
| `content/filterButtons.js` | content | Collapse-all-folders, single-click tree navigation |
| `content/shapePopup.js` | content | Double-click quick-shape popup |
| `content/menuOpen.js` | content | Open-in-new-tab icon on dropdown menus (old and new Boomi UI) |
| `content/copyDocument.js` | content | Clipboard-copy button in the Document Viewer dialog |
| `content/downloadRename.js` | content | Intercepts document downloads for auto-renamed filenames |
| `content/reminders.js` | content | Post-deployment schedule reminder |
| `content/headerActions.js` | content | Header show/hide toggle, copy component ID/URL, update overlay close |
| `content/updateNotification.js` | content | Per-version changelog popup |
| `content/iconSets.js` | content | Icon set data for shape styling |
| `content/listenerGlobal.js` | content | Reads config from storage, caches it, runs the DOM poller |
| `content/canvas.js` | content | Canvas grid toggle |
| `content/customRefresh.js` | content | Custom process-reporting refresh interval |
| `content/shapes.js` | content | Trace path highlight |
| `content/endpointGlow.js` | content | Endpoint glow, quick-add Stop shape |
| `content/tableWrap.js` | content | Table text-wrap toggles |
| `content/modalButtons.js` | content | Reverse modal OK/Cancel order |
| `content/imageCapture.js` | content | Process flow → PNG capture |
| `content/groups.js` | content | Note group overlays on canvas |
| `content/connectionOperations.js` | content | Connection operation screen sizing |
| `content/versionNotification.js` | content | Close button on revision notification |
| `content/sqlEditor.js` | content | CodeMirror SQL editor |
| `content/brandLogo.js` | content | Replaces the Boomi masthead brand logo |
| `content/svgAssets.js` | content | Shared SVG icon strings |
| `content/modalHelper.js` | content | Boomi-style modal dialog helper |
| `content/toastHelper.js` | content | Toast notification utility |
| `page/fullscreen.js` | page | Full-screen toggle (page context required) |
| `options.js` | options | Options page save/restore |
| `background.js` | background | Service worker: download rename + options-page-open message |

> `.Old Scripts but want to keep/` contains archived scripts (`copyComponentid.js`, `customprocessButtons.js`, `home.js`, `initPage.js`, `jsonView.js`, `sqlView.js`, `dbsqlEditor.js`) — previous versions of features no longer in rotation. They are not loaded by any manifest. Do not modify or re-integrate them without understanding why they were removed.

</details>

### To release

```bash
# 1. Bump version in package.json
# 2. Build
npm run build
# 3. Upload zips from build/ to each browser store
```

<p align="right"><sub><a href="#-contents">↑ Back to top</a></sub></p>

---

### Built With

- **[esbuild](https://esbuild.github.io/)** — content-script bundling
- **[jQuery 4.0](https://jquery.com/)** — DOM manipulation
- **[CodeMirror](https://codemirror.net/)** — code editor for Message/Notify shapes
- **[arrive.js](https://github.com/uzairfarooq/arrive)** — DOM mutation observer
- **[showdown](https://github.com/showdownjs/showdown)** — Markdown rendering
- **[rasterizeHTML.js](https://github.com/cburgmer/rasterizeHTML.js)** — process flow image capture

---

## 🤝 Contributing

Contributions are welcome. Please [open an issue](https://github.com/mitchelljfranklin/BoomiXcel/issues) before starting substantial work to discuss the change.

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

## 💬 Discussion

Join the [Boomi Discord — #extension-enhancer](https://discord.gg/XcXRrYHVUa) for updates and discussion.

---

## 🔒 Privacy

**Boomi Xcel does not collect, transmit, or store any data from your Boomi platform environment.** The extension runs entirely in your browser — no analytics, no telemetry, no external servers. Your preferences are saved locally and synced across your signed-in browsers via `chrome.storage.sync`. For full details, see [PRIVACY.md](PRIVACY.md).

---

## 🔐 Security

Found a vulnerability? Please **do not** open a public issue. See [SECURITY.md](SECURITY.md) for responsible disclosure.

<p align="right"><sub><a href="#-contents">↑ Back to top</a></sub></p>

---

## ❓ FAQ

<details>
<summary><b>Is Boomi Xcel associated with Boomi?</b></summary>

No. Boomi Xcel is an independent, community-built extension. Boomi has no affiliation with this project and does not endorse or support it.
</details>

<details>
<summary><b>Does it collect or transmit any data?</b></summary>

No. The extension runs entirely in your browser — no analytics, no telemetry, no external servers. Your preferences are stored locally via `chrome.storage.sync` and synced across your signed-in browsers. See [PRIVACY.md](PRIVACY.md) for full details.
</details>

<details>
<summary><b>How do I access the settings?</b></summary>

Right-click the extension icon and select **Options**, or click the `[options]` link in the Boomi footer bar. Changes take effect after clicking **Save** and reloading the Boomi platform tab.
</details>

<details>
<summary><b>How do I report a bug or request a feature?</b></summary>

[Open an issue](https://github.com/mitchelljfranklin/BoomiXcel/issues) on GitHub, or join the [Boomi Discord](https://discord.gg/XcXRrYHVUa) to discuss.
</details>

<details>
<summary><b>Why aren't my changes taking effect?</b></summary>

After changing options, click **Save** in the options page, then reload any open Boomi platform tabs. A settings-changed dialog will also prompt you to reload if changes are detected from another tab.
</details>

<details>
<summary><b>How do I update the extension?</b></summary>

Updates are handled automatically by your browser. Chrome, Firefox, and Edge check for updates periodically and install them without any action needed. You can check your current version in the extension footer bar or in `chrome://extensions`.
</details>

<details>
<summary><b>Can I use this on my work-managed browser?</b></summary>

It depends on your organization's browser policies. Some IT departments block third-party extensions or restrict Chrome Web Store access. Contact your IT team if the install is blocked.
</details>

<details>
<summary><b>What permissions does it need and why?</b></summary>

| Permission | Reason |
|-----------|--------|
| `storage` | Save your preferences and sync them across browsers |
| `downloads` | Rename downloaded documents to `<ProcessName>_<timestamp>.<ext>` |
| `scripting` | Inject code to enhance the Boomi Platform pages |
| Host: `platform.boomi.com` | The extension only runs on Boomi pages |

No other sites are accessed.
</details>

<p align="right"><sub><a href="#-contents">↑ Back to top</a></sub></p>

---

## 📄 License

Distributed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.

## 👥 Contributors

Thanks to everyone who has contributed to making Boomi Xcel better!

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/mitchelljfranklin"><img src="https://github.com/mitchelljfranklin.png" width="80px" alt=""/><br /><sub><b>Mitch Franklin</b></sub></a><br /><sub>💻 📖 🚧</sub></td>
    <td align="center"><a href="https://github.com/baptistebieber"><img src="https://github.com/baptistebieber.png" width="80px" alt=""/><br /><sub><b>Baptiste BIEBER</b></sub></a><br /><sub>💻</sub></td>
    <td align="center"><a href="https://github.com/matt-flaig"><img src="https://github.com/matt-flaig.png" width="80px" alt=""/><br /><sub><b>Matthew Flaig</b></sub></a><br /><sub>💻</sub></td>
    <td align="center"><a href="https://github.com/bbendick"><img src="https://github.com/bbendick.png" width="80px" alt=""/><br /><sub><b>bbendick</b></sub></a><br /><sub>💻</sub></td>
    <td align="center"><a href="https://github.com/Fermartyni"><img src="https://github.com/Fermartyni.png" width="80px" alt=""/><br /><sub><b>Fernando Martín</b></sub></a><br /><sub>💻</sub></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Tony Banik</b></sub><br /><sub>💡</sub></td>
    <td align="center"><sub><b>Noah Skelton</b></sub><br /><sub>💻</sub></td>
    <td align="center"><a href="https://community.boomi.com/"><sub><b>The Boomi Community</b></sub></a><br /><sub>💬</sub></td>
    <td align="center"><a href="https://discord.gg/XcXRrYHVUa"><sub><b>Boomi Discord</b></sub></a><br /><sub>💬</sub></td>
  </tr>
</table>
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

Want to see your name here? Check out the [Contributing](#-contributing) section.
