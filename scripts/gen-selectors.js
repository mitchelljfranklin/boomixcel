/**
 * SELECTORS.md generator — parses all content scripts and boomi.css,
 * extracts every selector grouped by Boomi page/dialog area.
 *
 * Usage: node scripts/gen-selectors.js
 * Output: SELECTORS.md (project root)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src", "library", "boomiapp", "content");
const CSS_FILE = path.join(ROOT, "src", "library", "css", "boomi.css");
const OUTPUT = path.join(ROOT, "SELECTORS.md");

// ── File → Area mapping ─────────────────────────────────────────────────────

var FILE_AREA_MAP = {
  // Build Canvas — process component editor
  imageCapture:             "Build Canvas",
  shapes:                   "Build Canvas",
  endpointGlow:             "Build Canvas",
  shapePopup:               "Build Canvas",
  shapePalette:             "Build Canvas",
  setPropertiesExtractor:   "Build Canvas",
  copySetProperty:          "Build Canvas",
  defaultScriptingLanguage: "Build Canvas",
  messageEditor:            "Build Canvas",
  sqlEditor:                "Build Canvas",
  nativeEditorResize:       "Build Canvas",
  packagedComponentsResize: "Build Canvas",
  canvas:                   "Build Canvas",
  connectionOperations:     "Build Canvas",
  copyComponentDefaults:    "Build Canvas",
  packageNotesAutoApply:    "Build Canvas",

  // Process Reporting — execution monitoring
  customRefresh:            "Process Reporting",
  processDuration:          "Process Reporting",
  scheduleIcons:            "Process Reporting",

  // Deploy Wizard / Package Manager
  deploymentNotes:          "Deploy Wizard",
  runProcessFromDeployment: "Deploy Wizard",
  reminders:                "Deploy Wizard",

  // Show Log Dialog
  logHighlight:             "Show Log Dialog",
  logDefaultStatus:         "Show Log Dialog",

  // Document Viewer Dialog
  copyDocument:             "Document Viewer",
  downloadRename:           "Document Viewer",
  documentViewer:           "Document Viewer",

  // Filter Panel / Sidebar Tree
  buildFilters:             "Filter Panel",
  filterButtons:            "Filter Panel",

  // View in Process Reporting (context menu + filter auto-apply)
  viewInReporting:          "Process Reporting",

  // Header / Navigation (global masthead, menus)
  headerActions:            "Header / Navigation",
  favicon:                  "Header / Navigation",
  menuOpen:                 "Header / Navigation",
  brandLogo:                "Header / Navigation",
  keyboardShortcuts:        "Header / Navigation",
  pageInit:                 "Header / Navigation",
  updateNotification:       "Header / Navigation",
  versionNotification:      "Header / Navigation",
  contentScript:            "Header / Navigation",

  // BoomiAI / Boomi GPT
  boomiGpt:                 "BoomiAI",

  // Shared / Across pages
  modalButtons:             "Modals (shared)",
  modalHelper:              "Modals (shared)",
  toastHelper:              "Modals (shared)",
  tableWrap:                "Tables (shared)",
  chooserTooltip:           "Chooser (shared)",

  // Global (bundle-scope utilities)
  global:                   "Global",
  listenerGlobal:           "Global",
  svgAssets:                "Global",
  iconSets:                 "Global",
};

// ── Regex patterns for extracting selectors ────────────────────────────────

// querySelector/querySelectorAll: captures content between quotes
var QUERYSELECTOR_RE = /\.(?:querySelector|querySelectorAll)\s*\(\s*(['"`])([^'"`]+?)\1/g;

// jQuery $('...'), $(element).find(...)
var JQUERY_FIND_RE = /\$\([^)]+\)\s*\.\s*find\s*\(\s*(['"`])([^'"`]+?)\1/g;

// jQuery $('...') — standalone
var JQUERY_DIRECT_RE = /\$\s*\(\s*(['"`])([^'"`]+?)\1/g;

// document.getElementById('...')
var GETELEMENTBYID_RE = /\.getElementById\s*\(\s*(['"`])([^'"`]+?)\1/g;

// document.arrive('...', ...)
var ARRIVE_RE = /\.arrive\s*\(\s*(['"`])([^'"`]+?)\1/g;

// classList.add/remove/toggle/contains('...')
var CLASSLIST_RE = /\.classList\s*\.\s*(?:add|remove|toggle|contains)\s*\(\s*(['"`])([^'"`]+?)\1/g;

// data-locator="..." in string/template literals
var DATA_LOCATOR_RE = /data-locator\s*=\s*(['"])([^'"\n]+?)\1/g;

// data-testid="..." in string/template literals
var DATA_TESTID_RE = /data-testid\s*=\s*(['"])([^'"\n]+?)\1/g;

// data-locator^="..." / data-locator*="..."
var DATA_LOCATOR_PREFIX_RE = /data-locator[*^]=\s*(['"])([^'"\n]+?)\1/g;

// className assignment: .className = '...' or element.className = '...'
var CLASSNAME_ASSIGN_RE = /\.className\s*=\s*(['"`])([^'"`]+?)\1/g;

// id: '...' or text: '...' (for renderBoomiModal button objects)
var ID_STRING_RE = /id\s*:\s*(['"`])([^'"`]+?)\1/g;

// overlayClass: '...' (renderBoomiModal)
var OVERLAY_CLASS_RE = /overlayClass\s*:\s*(['"`])([^'"`]+?)\1/g;

// ── Helpers ─────────────────────────────────────────────────────────────────

function readFileAsLines(filePath) {
  var content = fs.readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
  return content.split("\n");
}

function extractSelectors(lines, filePath, regex, group, includeLine) {
  var results = [];
  var joined = lines.join("\n");
  var match;

  while ((match = regex.exec(joined)) !== null) {
    results.push({
      selector: match[group],
      file: path.basename(filePath),
      line: includeLine ? getLineNumber(joined, match.index) : null,
    });
  }
  return results;
}

function getLineNumber(text, offset) {
  var count = 1;
  for (var i = 0; i < offset; i++) {
    if (text[i] === "\n") count++;
  }
  return count;
}

function dedupe(results) {
  var seen = new Set();
  return results.filter(function (item) {
    var key = item.selector + "|" + item.file;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter(function (item) {
    // Filter out noise selectors
    var s = item.selector;
    if (!s || s.length < 2) return false;
    if (s === "'" || s === '"' || s === "`") return false;
    if (s === "''" || s === '""' || s === "``") return false;
    // Skip selectors that are just JS property values / numbers
    if (/^[0-9.]{1,6}$/.test(s)) return false;
    if (/^'(|)'$/.test(s)) return false;
    if (/^(true|false|null|undefined)$/i.test(s)) return false;
    if (/^(none|auto|block|flex|hidden|visible|inline)$/i.test(s) && !s.startsWith(".") && !s.startsWith("#") && !s.startsWith("[")) return false;
    // Skip selectors that look like raw CSS property values
    if (/^\d+(px|em|%|vh|vw|s|ms|deg)?$/.test(s)) return false;
    return true;
  });
}

// ── CSS selector extraction ────────────────────────────────────────────────

function extractCssSelectors() {
  var raw = fs.readFileSync(CSS_FILE, "utf-8").replace(/\r\n/g, "\n");

  // Remove comment blocks
  var stripped = raw.replace(/\/\*[\s\S]*?\*\//g, "");

  // Line-by-line state machine: track brace depth to find selector lines
  var lines = stripped.split("\n");
  var depth = 0;
  var pendingSelector = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    // Skip @-rules
    if (line.startsWith("@")) continue;

    // If depth is 0, this might be the start of a selector
    if (depth === 0) {
      // Heuristic: if line contains {, the text before { is the selector
      var bracePos = line.indexOf("{");
      if (bracePos !== -1) {
        pendingSelector = line.substring(0, bracePos).trim();
        depth += (line.split("{").length - 1) - (line.split("}").length - 1);
      } else {
        // Multi-line selector (comma-separated across lines)
        pendingSelector += " " + line;
      }
    } else if (depth > 0) {
      // Inside a rule block — track depth
      depth += (line.split("{").length - 1) - (line.split("}").length - 1);
      if (depth === 0 && pendingSelector) {
        // Rule ended — process the pending selector
        var parts = pendingSelector.split(",");
        for (var j = 0; j < parts.length; j++) {
          var sel = parts[j].trim().replace(/\s+/g, " ");
          if (isValidCssSelector(sel)) {
            cssResults.push(sel);
          }
        }
        pendingSelector = "";
      }
    }
  }

  return dedupe(cssResults.map(function (s) {
    return { selector: s, file: "boomi.css", line: null };
  }));
}

var cssResults = [];

function isValidCssSelector(selector) {
  if (!selector || selector.length < 2 || selector.length > 200) return false;
  if (selector === "to" || selector === "from") return false; // @keyframes
  // Skip selectors that look like CSS property:value pairs
  if (/^[a-z-]+\s*:/.test(selector) && /^\s*\d/.test(selector.split(":")[1] || "")) return false;
  // Must contain a class, ID, or known element name, or attribute selector
  if (!/[.#[]/.test(selector) && !/^[a-z]/.test(selector)) return false;
  // Skip raw numbers or prop:val things
  if (/^\d+(px|em|%|s)?/.test(selector) && selector.length < 10) return false;
  return true;
}

// ── File-based extraction ───────────────────────────────────────────────────

function extractFromFile(filePath) {
  var lines = readFileAsLines(filePath);
  var joined = lines.join("\n");
  var baseName = path.basename(filePath);

  var selectors = [];

  // querySelector/querySelectorAll — group 2 is the selector
  selectors = selectors.concat(extractSelectors(lines, filePath, QUERYSELECTOR_RE, 2, false));
  // getElementById — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, GETELEMENTBYID_RE, 2, false));
  // document.arrive — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, ARRIVE_RE, 2, false));
  // classList — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, CLASSLIST_RE, 2, false));
  // className assignment — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, CLASSNAME_ASSIGN_RE, 2, false));
  // data-locator — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, DATA_LOCATOR_RE, 2, false));
  // data-testid — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, DATA_TESTID_RE, 2, false));
  // data-locator^= / data-locator*= — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, DATA_LOCATOR_PREFIX_RE, 2, false));
  // id: '...' in objects — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, ID_STRING_RE, 2, false));
  // overlayClass — group 2
  selectors = selectors.concat(extractSelectors(lines, filePath, OVERLAY_CLASS_RE, 2, false));

  // jQuery $(...).find('...') — group 2 is the inner selector
  var jqfMatch;
  while ((jqfMatch = JQUERY_FIND_RE.exec(joined)) !== null) {
    selectors.push({
      selector: jqfMatch[2],
      file: baseName,
      line: getLineNumber(joined, jqfMatch.index),
    });
  }

  // jQuery $('...') direct — group 2 is the selector
  var jqMatch;
  while ((jqMatch = JQUERY_DIRECT_RE.exec(joined)) !== null) {
    selectors.push({
      selector: jqMatch[2],
      file: baseName,
      line: getLineNumber(joined, jqMatch.index),
    });
  }

  return dedupe(selectors);
}

// ── Old extraction still needed for helpers ───────────────────────────────

function extractSelectors(lines, filePath, regex, group, includeLine) {
  var results = [];
  var joined = lines.join("\n");
  var match;

  while ((match = regex.exec(joined)) !== null) {
    var value = match[group];
    if (!value) continue;
    results.push({
      selector: value,
      file: path.basename(filePath),
      line: includeLine ? getLineNumber(joined, match.index) : null,
    });
  }
  return results;
}

// ── Categorize CSS selectors ───────────────────────────────────────────────

var CSS_AREA_MAP = {
  // Build Canvas
  "canvas_grid":                   "Build Canvas",
  "hide_canvas_grid":              "Build Canvas",
  "greenGlow":                     "Build Canvas",
  "redGlow":                       "Build Canvas",
  "yellowGlow":                    "Build Canvas",
  "gwt-TestFocused":               "Build Canvas",
  "disconnected":                  "Build Canvas",
  "bph-endpoint-flash":            "Build Canvas",
  "BoomiPlatformEndpointMenu":     "Build Canvas",
  "BoomiPlatform_showconnections": "Build Canvas",
  "bph-shape-handler":             "Build Canvas",
  "gwt-connectors-path":           "Build Canvas",
  "gwt-connectors-line":           "Build Canvas",
  "gwt-connectors-svg":            "Build Canvas",
  "BoomiPlatform-linetrace":       "Build Canvas",
  "BoomiPlatform-lineparent":      "Build Canvas",
  "component_header":              "Build Canvas",
  "component_editor_panel":        "Build Canvas",
  "gwt-ProcessPanel":              "Build Canvas",
  "gwt-Shape":                     "Build Canvas",
  "gwt-EndPoint":                  "Build Canvas",
  "gwt-ParamPopup":                "Build Canvas",
  "base_shape_container":          "Build Canvas",
  "shape_side_panel":              "Build Canvas",
  "anchor_side_panel":             "Build Canvas",
  "canvas_notes_step_panel":       "Build Canvas",
  "mock_form_label":               "Build Canvas",
  "shape_palette_widget":          "Build Canvas",
  "collapsible_base_panel":        "Build Canvas",
  "new_shape_chooser_popup":       "Build Canvas",
  "category_row_hover_style":      "Build Canvas",
  "bpe-quickshape-popup":          "Build Canvas",
  "bpe-quickshape-shape":          "Build Canvas",
  "bpe-shape-icon":                "Build Canvas",
  "bpe-editor-modal":              "Build Canvas",
  "bpe-editor-resize-handle":      "Build Canvas",
  "flex_panel_message_editor":     "Build Canvas",
  "flex_panel_sql":                "Build Canvas",
  "bph-sql-resize-container":      "Build Canvas",
  "bph-sql-resize-handle":         "Build Canvas",
  "bpe-sql-query-button":          "Build Canvas",
  "inline_script_editor":          "Build Canvas",
  "prog_cmd_panel":                "Build Canvas",
  "build_actionsButton":           "Build Canvas",
  "note-content":                  "Build Canvas",
  "lockandEditButtonNew":          "Build Canvas",
  "closeButtonNew":                "Build Canvas",
  "save_controls":                 "Build Canvas",
  "bph-extract-setproperties":     "Build Canvas",
  "bpe-setprops-modal":            "Build Canvas",
  "bpe-setprops-table":            "Build Canvas",
  "bpe-setprops-body":             "Build Canvas",
  "bpe-setprops-container":        "Build Canvas",
  "bpe-setprops-footer":           "Build Canvas",
  "bpe-setprops-count":            "Build Canvas",
  "bpe-setprops-duplicate":        "Build Canvas",
  "bph-copy-property":             "Build Canvas",
  "bph-copyprop-menu":             "Build Canvas",
  "bph-copyprop-item":             "Build Canvas",
  "bph-copy-fallback-textarea":    "Build Canvas",
  "bph-copy-container":            "Build Canvas",
  "bph-copy-btn":                  "Build Canvas",
  "bph-capture-process":           "Build Canvas",
  "bph-capture-options":           "Build Canvas",
  "bph-capture-toggle-row":        "Build Canvas",
  "bph-capture-scale":             "Build Canvas",
  "bph-monitor-link":              "Build Canvas",
  "bph-collapse-btn":              "Build Canvas",
  "step_pellete":                  "Build Canvas",
  "dragdrop-selected":             "Build Canvas",
  "dragdrop-draggable":            "Build Canvas",
  "gwt-Label":                     "Build Canvas",
  "boomiConnect":                  "Build Canvas",
  "connectorText":                 "Build Canvas",
  "connectorVal":                  "Build Canvas",
  "gwt-DetailAreaInner":           "Build Canvas",
  "smallLabels":                   "Build Canvas",
  "openimage":                     "Build Canvas",
  "boomiDown":                     "Build Canvas",
  "testModeCover":                 "Build Canvas",
  "testModeBack":                  "Build Canvas",
  "copy_paste_panel":              "Build Canvas",
  "glass_standard":                "Build Canvas",

  // Process Reporting
  "reporting-type-menu":           "Process Reporting",
  "reporting-tab":                 "Process Reporting",
  "reporting_right_side":          "Process Reporting",
  "refresh_reporting":             "Process Reporting",
  "refresh_primary_action":        "Process Reporting",
  "refresh_doing_action":          "Process Reporting",
  "refresh_pulse":                 "Process Reporting",
  "bph-processing-row":            "Process Reporting",
  "bph-elapsed-badge":             "Process Reporting",
  "bph-elapsed-active":            "Process Reporting",
  "bph-elapsed-tick":              "Process Reporting",
  "auto_refresh_li":               "Process Reporting",
  "bph-reporting-separator":       "Process Reporting",
  "bph-reporting-item":            "Process Reporting",
  "bph-reporting-icon":            "Process Reporting",

  // Deploy Wizard
  "packaged_component_panel":      "Deploy Wizard",
  "deploy_review_screen":          "Deploy Wizard",
  "bph-run-deploy-now":            "Deploy Wizard",
  "bph-deploy-notes-done":         "Deploy Wizard",
  "bph-reminder-badge":            "Deploy Wizard",

  // Show Log Dialog
  "center_panel.showLogNew":       "Show Log Dialog",
  "bph-log-warning":               "Show Log Dialog",
  "bph-log-status-applied":        "Show Log Dialog",

  // Document Viewer
  "documentViewer":                "Document Viewer",
  "dbview-controls":               "Document Viewer",
  "dbview-toggle-row":             "Document Viewer",
  "dbview-maximize-btn":           "Document Viewer",
  "dbview-maximized":              "Document Viewer",
  "dbview-table":                  "Document Viewer",
  "dbview-search":                 "Document Viewer",
  "dbview-pagination":             "Document Viewer",
  "dbview-page-btn":               "Document Viewer",
  "dbview-page-info":              "Document Viewer",
  "dbview-table-wrapper":          "Document Viewer",

  // Filter Panel
  "filter_panel_dialog_popup_panel":"Filter Panel",
  "filterable_tree_loading_container":"Filter Panel",
  "button-bar":                    "Filter Panel",
  "gwt-FastTree":                  "Filter Panel",
  "gwt-FastTreeItem":              "Filter Panel",
  "gwt-TreeRightAlign":            "Filter Panel",
  "children":                      "Filter Panel",
  "closed":                        "Filter Panel",
  "open":                          "Filter Panel",
  "filter_icon":                   "Filter Panel",
  "filter_input":                  "Filter Panel",

  // Header / Navigation
  "qm-c-servicenav":               "Header / Navigation",
  "qm-c-inlinemenu":               "Header / Navigation",
  "bph-brand-logo":                "Header / Navigation",
  "bph-masthead-options":          "Header / Navigation",
  "bph-status-dot":                "Header / Navigation",
  "bph-status-none":               "Header / Navigation",
  "bph-status-minor":              "Header / Navigation",
  "bph-status-major":              "Header / Navigation",
  "bph-status-critical":           "Header / Navigation",
  "bph-status-maintenance":        "Header / Navigation",
  "mastfoot":                      "Header / Navigation",
  "mastfoot-hidden":               "Header / Navigation",
  "footer_msg":                    "Header / Navigation",
  "bph-close-notification":        "Header / Navigation",
  "alternate_link":                "Header / Navigation",
  "headerShow":                    "Header / Navigation",
  "information_label_content":     "Header / Navigation",
  "boomimenuOpen":                 "Header / Navigation",

  // BoomiAI
  "bph-rev-checkbox":              "BoomiAI",
  "bph-rev-selected":              "BoomiAI",
  "bph-rev-hooked":                "BoomiAI",
  "bph-gpt-link-active":           "BoomiAI",
  "bph-gpt-using":                 "BoomiAI",
  "gwt-HistoryPopup":              "BoomiAI",
  "boomiGptPanel":                 "BoomiAI",
  "dataTable":                     "BoomiAI",
  "headerTable":                   "BoomiAI",

  // Shared
  "bph-modern-modal":              "Modals (shared)",
  "BoomiPlatformOverlay":          "Modals (shared)",
  "BoomiUpdateOverlay":            "Modals (shared)",
  "bph-toast":                     "Modals (shared)",
  "popupContent":                  "Modals (shared)",
  "form_header":                   "Modals (shared)",
  "button_set":                    "Modals (shared)",
  "modal_top":                     "Modals (shared)",
  "bph-thead-menu":                "Tables (shared)",
  "bph-wrap":                      "Tables (shared)",
  "bph-table-wrapped":             "Tables (shared)",
  "wrapped_text_column_style":     "Tables (shared)",
  "boomi_standard_table":          "Tables (shared)",

  // Global
  "bph-icon-color":                "Global",
  "bph-load-done":                 "Global",
  "bph-deploy-notes-done":         "Global",
  "bph-resizing":                  "Global",
  "qm-u-theme-dark":               "Global",
  "qm-u-theme-default":            "Global",
};

function classifyCssSelector(selector) {
  // Check for known area mappings
  for (var key in CSS_AREA_MAP) {
    if (selector.indexOf(key) !== -1) {
      return CSS_AREA_MAP[key];
    }
  }

  // Heuristic-based classification
  if (/\.gwt-Shape|\bgwt-EndPoint\b|\bcanvas\b|\.component_editor|\.build_actions|\.dragdrop|\.testMode|\.step_pellete|\bgwt-Image\b|\bgwt-connectors/.test(selector)) return "Build Canvas";
  if (/reporting|refresh_|elapsed/.test(selector)) return "Process Reporting";
  if (/\blog\b|\.showLog/.test(selector)) return "Show Log Dialog";
  if (/\.gwt-FastTree|\.rail\.simplify|filter_panel/.test(selector)) return "Filter Panel";
  if (/qm-c-servicenav|qm-c-inlinemenu|masthead|brand-logo|header/.test(selector)) return "Header / Navigation";
  if (/bph-modern-modal|BoomiPlatformOverlay|BoomiUpdateOverlay|bph-toast/.test(selector)) return "Modals (shared)";
  if (/boomi_standard_table|bph-wrap|bph-thead-menu/.test(selector)) return "Tables (shared)";
  if (/dbview|documentViewer/.test(selector)) return "Document Viewer";

  return "Other";
}

// ── Main ────────────────────────────────────────────────────────────────────

function generate() {
  var allJsSelectors = [];

  // Extract from every content .js file (skip bundle.js)
  var jsFiles = fs.readdirSync(CONTENT_DIR).filter(function (f) {
    return f.endsWith(".js") && f !== "bundle.js";
  });

  for (var i = 0; i < jsFiles.length; i++) {
    var filePath = path.join(CONTENT_DIR, jsFiles[i]);
    var extracted = extractFromFile(filePath);
    var baseName = jsFiles[i].replace(".js", "");

    // Tag each with its area
    for (var j = 0; j < extracted.length; j++) {
      extracted[j].area = FILE_AREA_MAP[baseName] || "Other";
    }
    allJsSelectors = allJsSelectors.concat(extracted);
  }

  // Extract CSS selectors
  var cssSelectors = extractCssSelectors();
  var categorizedCss = {};
  for (var k = 0; k < cssSelectors.length; k++) {
    var area = classifyCssSelector(cssSelectors[k].selector);
    if (!categorizedCss[area]) categorizedCss[area] = [];
    categorizedCss[area].push(cssSelectors[k].selector);
  }

  // Group JS selectors by area
  var jsByArea = {};
  for (var m = 0; m < allJsSelectors.length; m++) {
    var item = allJsSelectors[m];
    var area = item.area;
    if (!jsByArea[area]) jsByArea[area] = {};
    if (!jsByArea[area][item.file]) jsByArea[area][item.file] = [];
    jsByArea[area][item.file].push(item.selector);
  }

  // ── Build markdown ──────────────────────────────────────────────────────

  var areaOrder = [
    "Header / Navigation",
    "Build Canvas",
    "Process Reporting",
    "Deploy Wizard",
    "Show Log Dialog",
    "Document Viewer",
    "BoomiAI",
    "Filter Panel",
    "Modals (shared)",
    "Tables (shared)",
    "Chooser (shared)",
    "Global",
    "Other",
  ];

  var output = [];
  output.push("# SELECTORS.md");
  output.push("");
  output.push("Auto-generated reference of all CSS selectors, class names, `data-locator` values,");
  output.push("and `data-testid` attributes targeted by BoomiXcel content scripts.");
  output.push("");
  output.push("Regenerate with: `node scripts/gen-selectors.js`");
  output.push("");
  output.push("---");
  output.push("");

  // ── Table of Contents ──────────────────────────────────────────────────
  output.push("## Contents");
  output.push("");
  for (var a = 0; a < areaOrder.length; a++) {
    var areaName = areaOrder[a];
    if (jsByArea[areaName] || categorizedCss[areaName]) {
      output.push("- [" + areaName + "](#" + areaName.toLowerCase().replace(/\s+\/\s+/g, "").replace(/\s+/g, "-").replace(/[()]/g, "") + ")");
    }
  }
  output.push("");

  // ── Per-area sections ──────────────────────────────────────────────────
  for (var ai = 0; ai < areaOrder.length; ai++) {
    var area = areaOrder[ai];
    var hasJs = jsByArea[area];
    var hasCss = categorizedCss[area];

    if (!hasJs && !hasCss) continue;

    output.push("## " + area);
    output.push("");

    // ── Boomi Platform native selectors ─────────────────────────────────
    output.push("### Boomi platform native selectors");
    output.push("");
    output.push("| Selector | Source |");
    output.push("|---|---|");

    if (hasJs) {
      for (var fileName in hasJs) {
        var selectors = hasJs[fileName];
        // Only include Boomi native selectors (not bph-/bpe-)
        var native = selectors.filter(function (s) {
          return !s.startsWith("bph-") && !s.startsWith("bpe-") && !s.startsWith("#bph");
        });
        for (var ni = 0; ni < native.length; ni++) {
          output.push("| `" + native[ni] + "` | `" + fileName + "` |");
        }
      }
    }

    // Add CSS selectors that are Boomi native (not bph-/bpe-)
    if (hasCss) {
      var cssNative = categorizedCss[area].filter(function (s) {
        return !s.startsWith(".bph-") && !s.startsWith(".bpe-") &&
               !s.startsWith("#bph") && !s.startsWith("#bpe");
      });
      for (var ci = 0; ci < cssNative.length; ci++) {
        output.push("| `" + cssNative[ci] + "` | `boomi.css` |");
      }
    }

    output.push("");

    // ── BoomiXcel-added classes ─────────────────────────────────────────
    var bphSelectors = [];

    if (hasJs) {
      for (var fName in hasJs) {
        var sels = hasJs[fName];
        var custom = sels.filter(function (s) {
          return s.startsWith("bph-") || s.startsWith("bpe-") || s.startsWith("#bph");
        });
        for (var ci2 = 0; ci2 < custom.length; ci2++) {
          bphSelectors.push({ selector: custom[ci2], source: fName });
        }
      }
    }

    if (hasCss) {
      var cssCustom = categorizedCss[area].filter(function (s) {
        return s.startsWith(".bph-") || s.startsWith(".bpe-") ||
               s.startsWith("#bph") || s.startsWith("#bpe");
      });
      for (var ci3 = 0; ci3 < cssCustom.length; ci3++) {
        bphSelectors.push({ selector: cssCustom[ci3].replace(/^\./, "").replace(/^#/, ""), source: "boomi.css" });
      }
    }

    if (bphSelectors.length > 0) {
      output.push("### BoomiXcel-added classes (`bph-*` / `bpe-*`)");
      output.push("");
      output.push("| Class | Source |");
      output.push("|---|---|");
      for (var bi = 0; bi < bphSelectors.length; bi++) {
        output.push("| `" + bphSelectors[bi].selector + "` | `" + bphSelectors[bi].source + "` |");
      }
      output.push("");
    }

    output.push("---");
    output.push("");
  }

  // ── Write output ───────────────────────────────────────────────────────
  fs.writeFileSync(OUTPUT, output.join("\n"), "utf-8");
  console.log("Generated: SELECTORS.md");
}

generate();
