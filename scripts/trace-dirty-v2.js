/**
 * Dirty state tracer v2 — polls the existing onbeforeunload handler every 250ms
 * to detect the exact moment GWT's internal dirty flag flips. Also logs the last
 * 15 scroll/drag events in a ring buffer so you can see what triggered it.
 *
 * Usage:
 *   node scripts/trace-dirty-v2.js
 *   -> copy the console-ready snippet
 *   -> paste into F12 console on the build page BEFORE scrolling
 *   -> scroll around — when dirty triggers, you'll see the recent events
 */

var fs = require("fs");
var path = require("path");

function traceDirtyV2() {
  var originalHandler = window.onbeforeunload;
  var originalWindowHandler = originalHandler;

  // ── 1. First-run check ────────────────────────────────────────────────
  var fakeEvent = { type: "beforeunload", preventDefault: function () {}, returnValue: undefined };
  var testOnproperty = originalHandler ? originalHandler.call(window, fakeEvent) : undefined;
  var isDirty = !!testOnproperty;
  console.log(
    "%c[INITIAL]%c window.onbeforeunload " + (isDirty ? "IS SET AND DIRTY" : "is null/clean"),
    isDirty ? "color: red; font-weight: bold" : "color: #2e7d32",
    "color: inherit",
  );
  if (isDirty) console.log("  Message: " + JSON.stringify(String(testOnproperty)));

  // Check addEventListener-based beforeunload handlers
  var eventListenersInstalled = false;
  var origAddEL = EventTarget.prototype.addEventListener;
  var origRemoveEL = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, handler, options) {
    if (type === "beforeunload" && this === window) {
      eventListenersInstalled = true;
      console.log("%c[beforeunload addEventListener]%c handler registered", "color: #1565c0", "color: inherit");
      console.log("  Handler:", String(handler).substring(0, 120));
    }
    return origAddEL.call(this, type, handler, options);
  };

  // ── 2. Ring buffer of recent scroll/drag events ───────────────────────
  var eventBuffer = [];
  var MAX_BUFFER = 15;

  function pushEvent(label, detail) {
    eventBuffer.push("[" + new Date().toISOString().substring(11, 23) + "] " + label + " " + detail);
    if (eventBuffer.length > MAX_BUFFER) eventBuffer.shift();
  }

  // Hook canvas-level pointer events
  function hookCanvasEvents() {
    var canvas = document.querySelector(".gwt-ProcessPanel");
    if (!canvas) {
      canvas = document.querySelector(".component_editor_panel");
    }
    if (!canvas) {
      canvas = document.querySelector(".dragdrop-boundary");
    }
    if (!canvas) {
      canvas = document.body;
      console.log("  (no canvas found, watching body — less precise)");
    }

    var pointerTypes = ["mousedown", "mousemove", "mouseup", "wheel", "DOMMouseScroll",
                        "touchstart", "touchmove", "touchend", "dragstart", "drag", "dragend"];

    for (var i = 0; i < pointerTypes.length; i++) {
      (function (eventType) {
        canvas.addEventListener(eventType, function (event) {
          var pos = "";
          if (event.clientX !== undefined) pos = " at (" + event.clientX + "," + event.clientY + ")";
          pushEvent("CANVAS", eventType + pos);
        }, true); // capture phase — catches GWT handlers too
      })(pointerTypes[i]);
    }
  }

  hookCanvasEvents();

  // ── 3. Watch keydown (for arrow keys, spacebar, etc.) ────────────────
  window.addEventListener("keydown", function (event) {
    if (/^(Arrow|Space|Page)/.test(event.key || "")) {
      pushEvent("KEY", "keydown " + event.key);
    }
  }, true);

  // ── 4. Poll the onbeforeunload return value ───────────────────────────
  var lastDirty = isDirty;

  function checkDirtyState() {
    // Also walk addEventListener handlers by temporarily wrapping
    var handler = window.onbeforeunload;
    var result = handler ? handler.call(window, fakeEvent) : undefined;
    var nowDirty = !!result;

    if (nowDirty !== lastDirty) {
      lastDirty = nowDirty;
      if (nowDirty) {
        console.log(
          "%c[DIRTY TRIGGERED at " + new Date().toISOString().substring(11, 23) + "]%c handler returns: " + JSON.stringify(String(result)),
          "background: red; color: white; font-weight: bold; font-size: 14px",
          "color: inherit",
        );
        console.log("%c  Dirty message:%c " + JSON.stringify(result === "" || result === undefined ? "(empty)" : String(result)),
          "color: red", "color: inherit");
        console.log("%c  Last " + MAX_BUFFER + " events before trigger:", "font-weight: bold");
        for (var b = 0; b < eventBuffer.length; b++) {
          console.log("    " + eventBuffer[b]);
        }
        console.log("%c  Stack at detection:", "font-weight: bold");
        console.trace();
      } else {
        console.log(
          "%c[CLEAN at " + new Date().toISOString().substring(11, 23) + "]%c handler returned to clean state",
          "color: #2e7d32; font-weight: bold; font-size: 13px",
          "color: inherit",
        );
      }
    }
  }

  setInterval(checkDirtyState, 250);

  // ── 5. Hook addEventListener('beforeunload') for late registrations ──
  EventTarget.prototype.addEventListener = function (type, handler, options) {
    if (type === "beforeunload" && this === window) {
      console.log("%c[ADDED beforeunload listener]%c via addEventListener",
        "background: red; color: white; font-weight: bold", "color: inherit");
      console.log("  Handler:", String(handler).substring(0, 200));
      console.trace("Callstack:");
    }
    return origAddEL.call(this, type, handler, options);
  };

  // ── 6. Try to find GWT dirty state internals ──────────────────────────
  console.log("");
  console.log("%c[GWT Internals]%c Probing for dirty state objects:", "font-weight: bold", "color: inherit");
  try {
    // Check for GWT module exports
    var gwtKeys = Object.keys(window).filter(function (k) {
      return /dirty|Dirty|unsaved|Unsaved|modified|Modified/.test(k);
    });
    if (gwtKeys.length > 0) console.log("  window keys matching dirty/unsaved/modified:", gwtKeys);
    else console.log("  No window-level dirty GWT keys found");

    // Check sessionStorage / localStorage
    var ssKeys = [];
    try { for (var ss = 0; ss < sessionStorage.length; ss++) { var sk = sessionStorage.key(ss); if (/dirty|unsaved/i.test(sk)) ssKeys.push("sessionStorage." + sk); } } catch (e) {}
    try { for (var ls = 0; ls < localStorage.length; ls++) { var lk = localStorage.key(ls); if (/dirty|unsaved/i.test(lk)) ssKeys.push("localStorage." + lk); } } catch (e) {}
    if (ssKeys.length > 0) console.log("  Storage keys matching dirty/unsaved:", ssKeys);
    else console.log("  No storage-based dirty keys found");
  } catch (e) {
    console.log("  Error probing:", e.message);
  }

  console.log("");
  console.log("%c[Dirty Tracer v2] Active%c — poll every 250ms, event buffer: " + MAX_BUFFER + " events",
    "font-weight: bold; font-size: 14px; color: #2e7d32", "color: inherit");
  console.log("  Scroll, drag, pan — I'll flag the exact moment dirty triggers.");
  console.log("  Call %ctraceDirtyV2.stop()%c to end polling.",
    "font-weight: bold", "color: inherit");

  // ── Stop function ─────────────────────────────────────────────────────
  var _intervalId;
  traceDirtyV2.stop = function () {
    clearInterval(_intervalId);
    EventTarget.prototype.addEventListener = origAddEL;
    EventTarget.prototype.removeEventListener = origRemoveEL;
    console.log("%c[Dirty Tracer v2] Stopped.%c", "font-weight: bold", "color: inherit");
  };
  _intervalId = setInterval(checkDirtyState, 250);
}

// Output for console
var snippet = traceDirtyV2.toString() + "\n\ntraceDirtyV2();";

console.log("─".repeat(70));
console.log("Console-ready snippet (copy + paste into F12 console on the build page):");
console.log("");
console.log(snippet);
console.log("");
console.log("─".repeat(70));
