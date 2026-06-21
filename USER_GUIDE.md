# BoomiXcel User Guide

BoomiXcel enhances the Boomi Integration Platform (`platform.boomi.com`) with powerful productivity tools, visual improvements, and workflow optimizations. All features are configurable via the quick-settings popup or the extension options page.

---

## Table of Contents

- [Installation](#installation)
- [Quick Settings (Popup)](#quick-settings-popup)
- [Options Page](#options-page)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Build Canvas](#build-canvas)
- [Editing Tools](#editing-tools)
- [Navigation & Layout](#navigation--layout)
- [Process Reporting](#process-reporting)
- [Appearance](#appearance)
- [Download & Document Tools](#download--document-tools)
- [Notifications](#notifications)
- [Footer & Branding](#footer--branding)

---

## Installation

1. Visit one of the browser stores:
   - [Chrome Web Store](https://chromewebstore.google.com/detail/boomixcel/behhfojpggobllhaifocfcampokbfhko)
   - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/boomi-platform-enhancer-active)
2. Click **Install**
3. The extension auto-enables on `https://platform.boomi.com/*`

> **Disclaimer:** Boomi has no affiliation with this extension and does not support it, endorse its use, or provide any promises or warranties.

---

## Quick Settings (Popup)

Click the BoomiXcel icon in your browser toolbar to open a compact settings popup. This gives you instant access to the most-used feature toggles without leaving the Boomi platform:

| Toggle | Effect |
|--------|--------|
| Show Canvas Grid | Removes the dot grid from the build canvas |
| Replace Boomi Brand Logo | Shows the BoomiXcel logo in the masthead |
| Old-Style Play/Pause Icons | Restores legacy play/pause icons in deployed processes |
| Reverse Modal Buttons (OK/Cancel) | Swaps Cancel/OK to OK/Cancel order |
| Show Boomi Footer | Prevents the footer bar from being hidden |
| Unique Page Titles & Favicons | Simplified tab names + page-specific favicons |
| Default Process Filters | Auto-checks Process, Process Properties, Cross Reference, API Service filters |
| Post-Deployment Schedule Reminder | Reminds you to schedule after deploying |

Changes save immediately. Click **Reload Page** to apply them to the current Boomi tab, or **Full Settings** to open the complete options page.

---

## Options Page

Right-click the extension icon → **Options**, click the `[options]` link in the Boomi footer bar, or use the **Full Settings** button in the popup.

The options page groups settings into collapsible sections. Changes take effect after clicking **Save** and reloading the Boomi platform tab. A toast notification confirms each save.

| Section | What you can configure |
|---------|----------------------|
| **Appearance** | Shape icons, canvas grid, brand logo, play/pause icons, modal buttons, footer |
| **Build Canvas** | Endpoint notifications, trace path highlighting, table wrapping |
| **Process Reporting** | Auto-refresh interval, dashboard default time range |
| **Navigation & Shortcuts** | Full-screen shortcut key + modifiers, unique page titles/favicons, default filters |
| **Defaults** | Default scripting language for new shapes |
| **Reminders** | Post-deployment schedule reminder |

A **↺ Reset** button restores all defaults. A yellow dot appears when you have unsaved changes.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Alt + S` | Save the current flow — clicks the Save button for you |

> **Full Screen:** You can configure a custom key and modifier combination (Alt, Ctrl, Shift) in the Options page. The default key is `~` (keycode 192). When pressed, the extension clicks the "More" menu then "Enter Full Screen" (or "Exit Full Screen") for you.

---

## Build Canvas

### Capture Process Flow as PNG
Click the camera icon (📸) in the build toolbar to capture your entire process flow as a PNG image. Options include:
- **Transparent background** — removes the white background
- **Scale** — 1x (normal), 1.5x, or 2x resolution

### Shape Connector Palette
The old-style shape connector palette is restored, showing shapes at their original size with proper spacing.

### Quick-Shape Popup
**Double-click** anywhere on the process canvas to open a quick-shape popup. Type to search for a shape by name and click to add it.

### Endpoint Glow
Non-connected endpoints glow to help you spot unconnected shapes at a glance. Hover over a glowing endpoint to quick-add a **Stop** shape.

### Trace Path Highlighting
When running tests, the connector lines highlight as you hover over shapes, making it easy to trace execution paths.

### Canvas Grid
Remove the canvas dot grid for a cleaner workspace (configurable — pairs well with dark mode).

### View in Process Reporting
Quick access to Process Reporting from two entry points: a heartbeat SVG icon next to the Description link on the build page, and a menu item with a separator line in the chevron context menu on deployed process lists (Atom/Runtime). Both open Process Reporting in a new tab and auto-apply a process name filter (Add Filter → Process → type name → select checkbox → Apply). A confirming toast shows "Filtered for: {name}" when the filter is applied.

### Extract Set Properties
A list icon (📋) in the build toolbar scans every Set Properties shape on the canvas (visible or not), clicks each one, reads all property names and parameter values, and displays them in a modal table. The table has 4 columns: **Property Shape Name**, **Property Type**, **Property Name**, and **Parameters**. Property names that appear in multiple shapes are highlighted with a yellow background and amber left border for easy spotting. An **Export to Clipboard** button copies the data as tab-separated values for pasting into spreadsheets. The button is disabled and dimmed during extraction to prevent double-clicks, and a toast notification confirms the extraction is in progress.

---

## Editing Tools

### CodeMirror Editor
When editing Message, Notify, or Command shapes, the standard text field is replaced with a full **CodeMirror code editor** supporting:
- **JSON** — syntax highlighting, auto-close brackets
- **XML** — syntax highlighting, auto-close tags
- **HTML** — syntax highlighting
- **SQL** — syntax highlighting for Database Operation shapes

The editor respects the Boomi dark/light theme.

### Default Scripting Language

When creating new shapes with scripting (Data Process, Custom Scripting, Business Rules), BoomiXcel can auto-select your preferred scripting language instead of always defaulting to Groovy 1.5. Configure from the Options page under **Defaults**:

- **Off** — default, no auto-selection
- **Groovy 1.5**
- **Groovy 2.4**
- **JavaScript**

The extension only changes the dropdown when it first appears and does not override manual changes afterward.

### Copy Document Content
When viewing a document in Process Reporting, a clipboard icon (📋) appears in the dialog header. Click to copy the raw document content, with a visible "Copied" confirmation.

---

## Navigation & Layout

### Collapse All Folders
Buttons to collapse all process folders at once in:
- Process Reporting
- Deployed Processes

### Single-Click Folder Expand
Click anywhere on a process folder name to expand it — no need to aim for the tiny arrow icon.

### Open in New Tab
Every dropdown menu item now has an open-in-new-tab icon (↗). Works in both the old and new Boomi UI.

### Reverse Modal Buttons
Swap the Cancel/OK order to OK/Cancel, matching the side panel button layout (configurable).

### Remove Revision Notification
The sticky yellow "revision" notification on the build page gets a close button.

### Keep Close Button after Lock & Edit
Normally when you click **Lock & Edit** on a component tab, Boomi hides the Close button and shows Save / Save & Close instead. With this feature, the Close button stays visible so you can close the tab without saving if you change your mind.

### Copy Component ID/URL
A copy button appears on the build canvas header, letting you quickly copy a component's ID or URL to your clipboard.

### Adjust Connection Operation Screen
The connection operation screen is resized to give you more room for the configuration panel.

---

## Process Reporting

### Auto-Refresh
Click the **Refresh Every XX** button on the Process Reporting page to enable automatic refreshing at your configured interval (default: 15 seconds). The button shows a live countdown ("Refreshing in 10s") so you always know when the next refresh will fire. A subtle pulse animation confirms each refresh, and hovering over the button shows the last refresh timestamp. If you navigate away from Process Reporting while auto-refresh is running, it will automatically resume when you come back.

### Table Text Wrapping
Process Reporting tables can wrap text instead of cutting it off. Three modes available:
- **Never** — text is truncated (default)
- **Always** — text wraps to show all content
- **Toggle on Header Hover** — wrap mode activates when you hover over column headers

### Dashboard Default Time Range
The dashboard view auto-selects your chosen time range on page load. Configure from the Options page:
- **7 Days** — default
- **1 Month**
- **3 Months**
- **6 Months**
- **1 Year**
- **Max**

### Pending Executions Clock
When auto-refresh is enabled, a real-time elapsed time counter appears on the Process Reporting page for active processes. Active rows get a red left accent bar, the elapsed time displays as a gradient red badge, and the seconds digit bounces each time it updates so you can see it's live at a glance.

---

## Appearance

### Shape Icon Styling
Choose from 6 icon sets for build canvas shapes (configurable):
- **Off** — default Boomi icons
- **Legacy** — old-style icons
- **Modern** — refreshed icons
- **Minimal** — clean, simple icons
- **Minimal Inverted** — dark-themed minimal icons
- **Refreshed Inverted** — dark-themed refreshed icons

### Brand Logo Replacement
Replace the Boomi masthead logo with the BoomiXcel logo (configurable).

### Play/Pause Icons
Restore the old-style play and pause icons in deployed processes (configurable).

### Footer Visibility
Prevent the Boomi platform from hiding the footer bar (configurable).

### Page Titles & Favicons
- **Simplified tab names** — removes the account name prefix
- **Page-specific favicons** — distinct colored favicons for each page: Build (blue), Deploy (green), Dashboard (coral), Runtime (coral atom icon), Process Reporting (purple), MdmSphere (teal), ApiSphere (deep blue), BoomiAI (magenta), and Flow (orange)

---

## Download & Document Tools

### Auto-Rename Downloads
When you download a document from Boomi, the extension automatically renames the file to:
`<ProcessName>_<timestamp>.<extension>`

For example: `MyProcess_20240614_143052.json`

It detects the file type by analyzing the document content (JSON, XML, EDI, CSV, TXT). Binary files (ZIP, PDF, images) are identified and left with their original extension.

### DB Document Table Viewer
When viewing a database document (DBSTART| format) in the Document Viewer dialog, a **See table** toggle appears in the top-right corner. Toggle it on to render the raw pipe-delimited data as a sortable, searchable, paginated table. Click column headers to sort, use the search box to filter, and navigate with page buttons (25 rows per page). Once the table view is on, a **maximize** button appears to the left of the toggle, letting you expand the dialog to fill the screen for easier viewing; turning the table off hides the button and restores the dialog size.

### Copy Document Content
In the Document Viewer dialog, a copy button appears in the header. Click to copy the raw document content to your clipboard — works for JSON, XML, CSV, TXT, and even when the DB table view is active.

### Copy Component XML
When viewing a component's XML in the build page popup, a copy button appears in the header. Click to copy the clean XML to your clipboard — the button decodes HTML-encoded entities (`<br>` → newline, `&nbsp;` → space) so the pasted XML is ready to use.

---

## Notifications

### Platform Status
Every page shows the current Boomi platform status in the footer with a colored dot for at-a-glance visibility:
- Green dot = All Systems Operational
- Orange dot = Partial Service Disruption
- Red dot = Major Outage
- Blue dot = Under Maintenance

Links to the [Boomi Status page](https://status.boomi.com/).

### Settings Changed
When you change extension options from another tab, a dialog appears prompting you to reload the page for the changes to take effect. Includes a **Reload** button.

### Update Changelog
After each extension update, a changelog dialog appears once showing what's new. You can dismiss it by clicking Close.

### Boomi GPT Revision Compare
When viewing a component's Revision History, checkboxes appear next to each revision number. Click anywhere on a row to toggle selection — selected rows highlight in blue. Check two revisions and the Boomi GPT panel link updates to "Compare vX and vY →". Click it to open BoomiAI with a pre-filled compare prompt, which auto-submits after the page loads. Checking a third revision auto-unchecks the oldest selection. The revision table is slightly wider to comfortably fit column content.

### Schedule Reminder
After deploying a component, you'll receive a reminder to schedule it if appropriate.

---

## Footer & Branding

### Masthead Options Gear
A gear icon is added to the masthead icon row (next to Search, Help, Messages) providing quick access to the BoomiXcel options page without needing to scroll to the footer.

### Extension Footer Link
A "BoomiXcel vX.Y.Z" link appears in the Boomi footer bar showing the current version and linking to the Chrome Web Store.
