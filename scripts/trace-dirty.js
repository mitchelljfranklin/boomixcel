/**
 * Dirty state tracer — hook window.onbeforeunload setter, document.title setter,
 * and canvas event listeners to catch exactly what triggers the GWT dirty flag
 * when scrolling/moving shapes on the build canvas.
 *
 * Usage:
 *   node scripts/trace-dirty.js
 *   -> copy the console-ready snippet
 *   -> paste into F12 console on the build page
 *   -> scroll around or drag shapes
 *   -> any dirty-flag trigger prints the callstack immediately
 */

var fs = require("fs");
var path = require("path");

function traceDirty() {
  var caught = false;

  // ── 1. Hook window.onbeforeunload setter ──────────────────────────────
  var _onbeforeunload = Object.getOwnPropertyDescriptor(window, "onbeforeunload");
  if (_onbeforeunload) {
    var _getOn = _onbeforeunload.get;
    var _setOn = _onbeforeunload.set;
    Object.defineProperty(window, "onbeforeunload", {
      get: function () { return _getOn ? _getOn.call(this) : undefined; },
      set: function (value) {
        var oldVal = _getOn ? _getOn.call(this) : undefined;
        if (oldVal !== value && value !== null && value !== undefined) {
          caught = true;
          console.log("%c[DIRTY onbeforeunload SET]%c window.onbeforeunload = " + (typeof value) + " (was " + (typeof oldVal) + ")",
            "background: red; color: white; font-weight: bold; font-size: 14px", "color: inherit");
          console.trace("Callstack:");
          console.log("Value:", String(value).substring(0, 120));
        }
        if (_setOn) _setOn.call(this, value);
      },
      configurable: true,
      enumerable: true,
    });
  }

  // ── 2. Hook document.title setter ────────────────────────────────────
  var _titleDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "title") ||
                         Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "title");
  if (_titleDescriptor && _titleDescriptor.set) {
    var _titleSet = _titleDescriptor.set;
    var _titleGet = _titleDescriptor.get;
    Object.defineProperty(Document.prototype, "title", {
      get: function () { return _titleGet.call(this); },
      set: function (value) {
        var oldVal = _titleGet.call(this);
        if (oldVal !== value) {
          console.log("%c[TITLE CHANGE]%c " + JSON.stringify(oldVal) + " → " + JSON.stringify(value),
            "color: #e65100; font-weight: bold; font-size: 13px", "color: inherit");
          console.trace("Callstack:");
        }
        _titleSet.call(this, value);
      },
      configurable: true,
      enumerable: true,
    });
  }

  // ── 3. Hook addEventListener on the canvas to log events during scroll ──
  var originalAddEventListener = EventTarget.prototype.addEventListener;
  var loggedEvents = {};
  var canvasSelector = ".gwt-ProcessPanel";
  var canvasSelector2 = ".component_editor_panel";

  EventTarget.prototype.addEventListener = function (type, handler, options) {
    var self = this;
    // Only log events on or near the canvas
    if (self.matches && (self.matches(canvasSelector) || self.matches(canvasSelector2) || self.matches(".dragdrop-boundary"))) {
      if (!/^(scroll|mousedown|mousemove|mouseup|mousedrag|dragstart|drag|dragend|wheel|DOMMouseScroll|touchstart|touchmove|touchend)$/.test(type)) {
        return originalAddEventListener.call(self, type, handler, options);
      }
      // Log first occurrence of each event/handler combo
      var handlerStr = handler.name || (handler.toString().substring(0, 80));
      var key = self.tagName + "|" + type + "|" + handlerStr;
      if (!loggedEvents[key]) {
        loggedEvents[key] = true;
        console.log("%c[REGISTERED]%c " + elementShortSig(self) + " .addEventListener('" + type + "') → " + handlerStr,
          "color: #1565c0; font-weight: bold", "color: inherit");
      }
      // Wrap handler to log when it fires during scroll
      var wrappedHandler = function (event) {
        if (type === "scroll" || type === "wheel" || type === "DOMMouseScroll") {
          console.log("%c[EVENT FIRED]%c " + elementShortSig(self) + " '" + type + "' handler: " + handlerStr,
            "color: #e65100; font-weight: bold", "color: inherit");
        }
        return handler.call(this, event);
      };
      return originalAddEventListener.call(self, type, wrappedHandler, options);
    }
    return originalAddEventListener.call(self, type, handler, options);
  };

  function elementShortSig(element) {
    if (!element || !element.tagName) return "unknown";
    var tag = element.tagName.toLowerCase();
    if (element.className && typeof element.className === "string") {
      var cls = element.className.trim().split(/\s+/).slice(0, 2).join(".");
      return tag + "." + cls;
    }
    return tag;
  }

  // ── 4. Also hook beforeunload event directly ──────────────────────────
  window.addEventListener("beforeunload", function (event) {
    console.log("%c[beforeunload EVENT FIRED]%c (page thinks it's dirty)",
      "background: red; color: white; font-weight: bold; font-size: 14px", "color: inherit");
    console.trace("Callstack:");
  });

  console.log("%c[Dirty Tracer] Hooks installed:%c", "font-weight: bold; font-size: 14px", "color: inherit");
  console.log("  1. window.onbeforeunload setter — logs callstack when set");
  console.log("  2. document.title setter — logs callstack when changed");
  console.log("  3. Canvas addEventListener — wraps scroll/drag handlers, logs when they fire");
  console.log("  4. beforeunload event listener — logs when page tries to prevent unload");
  console.log("");
  console.log("%c  Now scroll or drag shapes — I'll catch what triggers dirty state.",
    "color: #2e7d32; font-weight: bold");
}

// Output for console
var snippet = traceDirty.toString() + "\n\ntraceDirty();";

console.log("─".repeat(70));
console.log("Console-ready snippet (copy + paste into F12 console on the build page):");
console.log("");
console.log(snippet);
console.log("");
console.log("─".repeat(70));
