/**
 * DOM mutation monitor — watch the Boomi build canvas for real-time changes.
 * Logs every DOM mutation (attribute, style, class, text) with old/new values
 * and polls document.title + window.onbeforeunload for non-DOM dirty indicators.
 *
 * Usage:
 *   node scripts/monitor-dom.js
 *   -> copy the console-ready snippet
 *   -> paste into F12 console on the build page
 *   -> scroll/move shapes around, then wait for the timer to expire
 *   -> the report prints to console
 */

var fs = require("fs");
var path = require("path");

function monitorDOM() {
  var DURATION_MS = 15000; // How long to watch (15 seconds)
  var changes = [];
  var titlePollInterval;

  function elementSig(element) {
    if (!element || !element.tagName) return "unknown";
    var tag = element.tagName.toLowerCase();
    var parts = [tag];
    if (element.id) parts.push("#" + element.id);
    if (element.className && typeof element.className === "string") {
      var cls = element.className.trim().replace(/\s+/g, ".");
      if (cls) parts.push("." + cls);
    }
    var loc = element.getAttribute && element.getAttribute("data-locator");
    if (loc) parts.push('[data-locator="' + loc + '"]');
    return parts.join("");
  }

  function logChange(type, element, detail) {
    changes.push({
      time: new Date().toISOString(),
      type: type,
      element: elementSig(element),
      detail: detail,
    });
    console.log(
      "%c[" + type + "]%c " + elementSig(element) + " %c" + detail,
      "color: #e65100; font-weight: bold",
      "color: inherit",
      "color: #1565c0",
    );
  }

  // MutationObserver — catches attribute, class, text, childList changes
  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      var target = mutation.target;

      if (mutation.type === "attributes") {
        var attrName = mutation.attributeName;
        // Skip our own injected classes/elements
        if (/^bph-|^bpe-/.test(attrName)) continue;
        if (target.className && /bph-|bpe-/.test(target.className)) continue;
        var oldVal = mutation.oldValue;
        var newVal = target.getAttribute(attrName);
        // Only log if the value actually changed
        if (oldVal !== newVal) {
          logChange(
            "ATTR",
            target,
            attrName + ": " + JSON.stringify(oldVal) + " \u2192 " + JSON.stringify(newVal),
          );
        }
        // Special: track body/html class changes (dirty indicator)
        if (target === document.body || target === document.documentElement) {
          console.log("%c[DIRTY-POSSIBLE]%c " + (target.tagName || "html") + " class changed",
            "color: red; font-weight: bold", "color: inherit");
        }
      }

      if (mutation.type === "characterData") {
        if (target.parentElement && /bph-|bpe-/.test(target.parentElement.className || "")) continue;
        logChange(
          "TEXT",
          target.parentElement || target,
          JSON.stringify(mutation.oldValue) + " \u2192 " + JSON.stringify(target.textContent),
        );
      }
    }
  });

  // Start observing the entire document body
  observer.observe(document.body, {
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
    subtree: true,
    attributeFilter: ["style", "class", "data-dirty", "data-modified", "aria-expanded", "aria-selected", "hidden", "disabled", "tabindex"],
  });

  // Also observe body for class changes specifically (not in attributeFilter above)
  observer.observe(document.body, {
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["class"],
  });

  // Poll document.title every 500ms (title changes don't trigger mutation observers)
  var lastTitle = document.title;
  var lastOnbeforeunload = typeof window.onbeforeunload === "function";
  titlePollInterval = setInterval(function () {
    if (document.title !== lastTitle) {
      logChange(
        "TITLE",
        document.documentElement,
        JSON.stringify(lastTitle) + " \u2192 " + JSON.stringify(document.title),
      );
      lastTitle = document.title;
    }
    var currentUnload = typeof window.onbeforeunload === "function";
    if (currentUnload !== lastOnbeforeunload) {
      logChange(
        "BEFOREUNLOAD",
        document.body,
        "window.onbeforeunload: " + lastOnbeforeunload + " \u2192 " + currentUnload,
      );
      lastOnbeforeunload = currentUnload;
    }
  }, 500);

  // Auto-stop after DURATION_MS
  console.log(
    "%c[DOM Monitor] Watching for mutations (title poll every 500ms)... auto-stop in " +
      DURATION_MS / 1000 +
      "s",
    "font-weight: bold; font-size: 14px",
  );
  console.log("%c  Scroll, drag shapes, interact — I'll log every change.", "color: #666");

  setTimeout(function () {
    clearInterval(titlePollInterval);
    observer.disconnect();
    console.log("");
    console.log("%c[DOM Monitor] Stopped. " + changes.length + " changes detected.",
      "font-weight: bold; font-size: 14px; color: " + (changes.length > 0 ? "#e65100" : "#2e7d32"));

    if (changes.length === 0) {
      console.log("%c  No DOM mutations occurred during the watch period.", "color: #2e7d32");
      console.log("%c  The dirty state must be entirely in JS memory (GWT internal flag).", "color: #666");
      console.log("%c  Check: Boomi likely uses GWT's DirtyStateManager or equivalent.", "color: #666");
    } else {
      // Group by type
      var groups = {};
      for (var g = 0; g < changes.length; g++) {
        var gt = changes[g].type;
        if (!groups[gt]) groups[gt] = 0;
        groups[gt]++;
      }
      console.log("%c  By type: " + JSON.stringify(groups), "color: #666");
      console.log("%c  Full log above \u2191", "color: #666");
    }
  }, DURATION_MS);
}

// Output for console
var snippet = monitorDOM.toString() + "\n\nmonitorDOM();";

console.log("─".repeat(70));
console.log("Console-ready snippet (copy + paste into F12 console on the build page):");
console.log("");
console.log(snippet);
console.log("");
console.log("─".repeat(70));
console.log("");
console.log("Watcher runs for 15 seconds. Scroll around, drag shapes, then wait.");
console.log("Reports every DOM mutation in real time with old\u2192new values.");
