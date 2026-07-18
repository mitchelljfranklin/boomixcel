/**
 * DOM capture utility — copy the one-liner to your browser console on any
 * Boomi page/dialog to capture its HTML structure (hierarchy + attributes,
 * no text content).
 *
 * Usage:
 *   node scripts/capture-dom.js
 *   -> copy the console-ready snippet
 *   -> paste into browser console (F12) on the target Boomi page/dialog
 *   -> the outline is copied to your clipboard
 *   -> paste into a new .html file under DOM snapshots/
 */

var fs = require("fs");
var path = require("path");

// The captureDOM() function — kept readable in the README, minified for console
function captureDOM() {
  function shouldSkip(element) {
    var tag = element.tagName;
    if (!tag) return true;
    if (/^(SCRIPT|STYLE|NOSCRIPT|BR|HR|SVG|PATH|LINK|META|HEAD|TITLE)$/i.test(tag)) return true;
    if (element.id && /^(bph-|bpe-)/.test(element.id)) return true;
    if (element.className && typeof element.className === "string" && /(bph-|bpe-)/.test(element.className)) return true;
    return false;
  }
  function elementSignature(element) {
    var tag = element.tagName.toLowerCase();
    if (!tag) return null;
    var parts = [tag];
    if (element.id && !/^gwt-uid-/.test(element.id)) parts.push("#" + element.id);
    if (element.className && typeof element.className === "string") {
      var classes = element.className.trim().split(/\s+/).filter(function (c) {
        return c.length > 0 && !c.startsWith("bph-") && !c.startsWith("bpe-");
      });
      if (classes.length > 0 && classes.length <= 6) parts.push("." + classes.join("."));
    }
    // Capture ALL data-* attributes (not just data-locator/data-testid)
    if (element.attributes) {
      for (var a = 0; a < element.attributes.length; a++) {
        var attr = element.attributes[a];
        var name = attr.name;
        if (/^data-/.test(name)) {
          parts.push("[" + name + '="' + attr.value + '"]');
        }
      }
    }
    var role = element.getAttribute("role");
    if (role) parts.push('[role="' + role + '"]');
    var ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) parts.push('[aria-label="' + ariaLabel + '"]');
    var gwtCell = element.getAttribute("__gwt_cell");
    if (gwtCell) parts.push('[__gwt_cell="' + gwtCell + '"]');
    if (element.getAttribute("__gwt_row") === "") parts.push("[__gwt_row]");
    return parts.join("");
  }
  function inlineStyle(element) {
    // Capture key positioning/style attributes that change with state
    var style = element.getAttribute("style");
    if (!style) return "";
    var props = ["left", "top", "transform", "width", "height", "display"];
    var parts = [];
    for (var i = 0; i < props.length; i++) {
      var re = new RegExp("(?:^|;\\s*)" + props[i] + "\\s*:\\s*([^;]+)", "i");
      var m = style.match(re);
      if (m) parts.push(props[i] + ": " + m[1].trim());
    }
    return parts.length > 0 ? " [style=\"" + parts.join("; ") + "\"]" : "";
  }
  function elementText(element) {
    // Capture text for stateful labels, buttons, and leaf elements.
    // Only for elements with no children (or only a text node) and short text.
    var tag = element.tagName.toLowerCase();
    var classStr = (element.className && typeof element.className === "string") ? element.className : "";
    // Always capture text for these important state-bearing classes
    var isImportant = /\b(savingMessage|test_title|gwt-Label|gwt-ClickableLabel|gwt-Button|menu-label|shape_label|collapsible_side_title|testResultsHeader|shapeReferenceLabel)\b/.test(classStr);
    // Also capture for buttons, links, and leaf elements with short text
    var isLeaf = element.children.length === 0;
    var isButton = tag === "button" || element.getAttribute("role") === "button" || /\bqm-button\b/.test(classStr);
    var isLink = tag === "a" || tag === "ex-menu-item";
    var shouldCapture = isImportant || (isLeaf && (isButton || isLink || classStr.length === 0));
    if (!shouldCapture) return "";
    var text = (element.textContent || "").trim();
    if (!text || text.length > 80) return "";
    // Clean up whitespace
    text = text.replace(/\s+/g, " ");
    return " /* \"" + text + "\" */";
  }
  function outline(element, depth) {
    if (shouldSkip(element)) return "";
    var sig = elementSignature(element);
    if (!sig && !element.children) return "";
    var indent = Array(depth + 1).join("  ");
    var extra = inlineStyle(element) + elementText(element);
    var line = sig ? indent + sig + extra : "";
    var childResults = [];
    for (var i = 0; i < element.children.length; i++) {
      var childResult = outline(element.children[i], depth + 1);
      if (childResult) childResults.push(childResult);
    }
    if (element.shadowRoot) {
      for (var j = 0; j < element.shadowRoot.children.length; j++) {
        var sChild = outline(element.shadowRoot.children[j], depth + 1);
        if (sChild) childResults.push(sChild);
      }
    }
    var result = line ? line + "\n" : "";
    if (childResults.length > 0) result += childResults.join("\n");
    return result;
  }
  var target = null;
  var popupContent = document.querySelector("#popup_on_popup_content");
  if (popupContent && popupContent.offsetParent !== null) {
    target = popupContent;
  } else {
    var activeModal = document.querySelector(".modal_top:not([style*='display: none'])");
    if (activeModal) target = activeModal.closest(".popupContent") || activeModal.closest(".gwt-DialogBox") || activeModal;
  }
  if (!target) {
    var canvas = document.querySelector(".component_editor_panel");
    if (canvas) target = canvas;
  }
  if (!target) target = document.body;
  var header = "<!-- DOM snapshot of: " + (document.title || "Unknown Page") + " -->\n";
  header += "<!-- URL: " + window.location.href + " -->\n";
  header += "<!-- Captured: " + new Date().toISOString() + " -->\n";
  // Diagnostics: things that change without DOM mutation
  header += "<!-- DIAGNOSTICS -->\n";
  header += "<!-- document.title : " + JSON.stringify(document.title) + " -->\n";
  header += "<!-- document.title dirty? (starts with *): " + (/^\*/.test(document.title)) + " -->\n";
  header += "<!-- window.onbeforeunload set: " + (typeof window.onbeforeunload === "function") + " -->\n";
  // Check GWT dirty state on common containers
  var bodyClass = document.body ? document.body.className : "";
  var htmlClass = document.documentElement ? document.documentElement.className : "";
  header += "<!-- body classes: " + JSON.stringify(bodyClass) + " -->\n";
  header += "<!-- html classes: " + JSON.stringify(htmlClass) + " -->\n";
  // Check for dirty/unsaved indicators in localStorage or sessionStorage
  header += "<!-- window.name: " + JSON.stringify(window.name || "") + " -->\n";
  header += "<!-- hash: " + JSON.stringify(window.location.hash || "") + " -->\n";
  header += "<!-- DIAGNOSTICS END -->\n\n";
  var result = header + outline(target, 0);
  result = result.replace(/\n{3,}/g, "\n\n");
  var textarea = document.createElement("textarea");
  textarea.value = result;
  textarea.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    console.log("[BoomiXcel] DOM snapshot copied to clipboard (" + result.split("\n").length + " lines)");
  } catch (e) {
    console.log("[BoomiXcel] DOM snapshot:\n\n" + result);
  }
  document.body.removeChild(textarea);
}

// Output directly — multi-line paste works fine in the browser console
var snippet = captureDOM.toString() + "\n\ncaptureDOM();";

console.log("─".repeat(70));
console.log("Console-ready snippet (copy + paste into F12 console on the target page):");
console.log("");
console.log(snippet);
console.log("");
console.log("─".repeat(70));

// ── Generate readable README ──────────────────────────────────────────────

var readable = captureDOM.toString();

var outputDir = path.resolve(__dirname, "..", "DOM snapshots");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

var readmeContent = [
  "# DOM Snapshots",
  "",
  "Captured HTML outlines of Boomi platform pages and dialogs.",
  "Used by the AI assistant to understand the DOM structure of pages",
  "that BoomiXcel hasn't touched yet.",
  "",
  "## How to capture",
  "",
  "1. Open the Boomi page or dialog you want to capture",
  "2. Run `node scripts/capture-dom.js` and copy the console-ready snippet it prints",
  "3. Open the browser console (F12) on the Boomi page/dialog",
  "4. Paste the snippet and press Enter",
  "5. The DOM outline is copied to your clipboard",
  "6. Paste it into a new `.html` file here, named after the page/dialog",
  "",
  "## How to use",
  "",
  "Tell the AI assistant which snapshot file to read, e.g.:",
  '> "Read DOM snapshots/show-log-dialog.html, then add a feature that..."',
  "",
  "---",
  "",
  "## The captureDOM() function (readable, for reference)",
  "",
  "```js",
  readable,
  "```",
].join("\n");

fs.writeFileSync(path.join(outputDir, "README.md"), readmeContent, "utf-8");
console.log("\nCreated: DOM snapshots/README.md (with readable captureDOM() function)");

var gitkeepPath = path.join(outputDir, ".gitkeep");
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, "", "utf-8");
}
